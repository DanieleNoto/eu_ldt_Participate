/** SPDX-License-Identifier: EUPL-1.2
 * Copyright (c) 2025, European Commission. Licensed under the EUPL-1.2
 * Authors:
 * Simone Bianchelli
 */

import { Page, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';

// Store results per test (aggregated by test name)
const testResults = new Map<string, Array<{ step: string; results: any; url: string }>>();

/**
 * Analyzes accessibility violations on the current page
 * Checks WCAG 2.0, 2.1, and 2.2 Level AA compliance
 * Aggregates results per test and saves at the end
 *
 * @param page - The Playwright page to analyze
 * @param stepName - Optional step name for identification
 */
export async function analyzeAccessibility(page: Page, stepName?: string): Promise<void> {
	const testInfo = test.info();

	// Get the full path of describe/test hierarchy
	const fullPath: string[] = testInfo.titlePath || [];

	// Find the first describe block
	let startIndex = 0;
	for (let i = 0; i < fullPath.length; i++) {
		if (fullPath[i].match(/^\[.*\]/)) {
			startIndex = i;
			break;
		}
	}

	// Take from first describe to current test
	const relevantPath = fullPath.slice(startIndex);

	// Auto-detect step name from test.info() or use provided
	const currentStep = stepName || testInfo.title || 'unnamed-step';

	const hierarchy = relevantPath.join(' / ');
	const testKey = relevantPath.join('::');

	console.log(`Running accessibility analysis for: ${hierarchy} / ${currentStep}`);

	// Execute accessibility scan
	const results = await new AxeBuilder({ page }).withTags(['wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();

	// Store results for this step
	if (!testResults.has(testKey)) {
		testResults.set(testKey, []);
	}

	testResults.get(testKey)!.push({
		step: currentStep,
		results: results,
		url: page.url()
	});

	const { violations, passes, incomplete } = results;
	console.log(
		`  Step "${currentStep}": Passed: ${passes.length}, Incomplete: ${incomplete.length}, Violations: ${violations.length}`
	);

	if (violations.length > 0) {
		console.warn(`  Accessibility issues in step "${currentStep}":`);
		violations.forEach((v: any, i: number) => {
			console.warn(`    ${i + 1}. ${v.id}: ${v.description} (${v.impact})`);
		});
	}
}

/**
 * Saves aggregated accessibility results for a test
 * Call this in test.afterEach hook
 */
export async function saveAccessibilityResults(): Promise<void> {
	const testInfo = test.info();
	const fullPath: string[] = testInfo.titlePath || [];

	let startIndex = 0;
	for (let i = 0; i < fullPath.length; i++) {
		if (fullPath[i].match(/^\[.*\]/)) {
			startIndex = i;
			break;
		}
	}

	const relevantPath = fullPath.slice(startIndex);
	const testKey = relevantPath.join('::');

	const stepResults = testResults.get(testKey);
	if (!stepResults || stepResults.length === 0) {
		return;
	}

	// Root directory for reports
	const baseDir = path.join(__dirname, '..', 'a11y-reports');

	// Sanitize and build structured path
	const safePath = relevantPath.map(p => p.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')).join('/');

	const testDir = path.join(baseDir, safePath);
	if (!fs.existsSync(testDir)) {
		fs.mkdirSync(testDir, { recursive: true });
	}

	const testName = relevantPath[relevantPath.length - 1];
	const sanitizedTestName = testName
		.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');

	// Aggregate all violations, passes, incomplete with step information
	const aggregatedResults = {
		testName: testName,
		testHierarchy: relevantPath.join(' / '),
		timestamp: new Date().toISOString(),
		steps: stepResults.map(sr => ({
			stepName: sr.step,
			url: sr.url,
			violations: sr.results.violations.map((v: any) => ({
				id: v.id,
				impact: v.impact,
				description: v.description,
				help: v.help,
				helpUrl: v.helpUrl,
				tags: v.tags,
				nodes: v.nodes
			})),
			passes: sr.results.passes.length,
			incomplete: sr.results.incomplete.map((inc: any) => ({
				id: inc.id,
				impact: inc.impact,
				description: inc.description,
				help: inc.help,
				helpUrl: inc.helpUrl,
				tags: inc.tags,
				nodes: inc.nodes
			}))
		})),
		summary: {
			totalSteps: stepResults.length,
			totalViolations: stepResults.reduce((sum, sr) => sum + sr.results.violations.length, 0),
			totalPasses: stepResults.reduce((sum, sr) => sum + sr.results.passes.length, 0),
			totalIncomplete: stepResults.reduce((sum, sr) => sum + sr.results.incomplete.length, 0),
			wcagBreakdown: getWCAGBreakdown(stepResults)
		}
	};

	/**
	 * Breaks down violations and incomplete by WCAG level
	 */
	function getWCAGBreakdown(stepResults: any[]): any {
		const breakdown = {
			wcag2aa: { violations: 0, incomplete: 0 },
			wcag21aa: { violations: 0, incomplete: 0 },
			wcag22aa: { violations: 0, incomplete: 0 }
		};

		stepResults.forEach(sr => {
			sr.results.violations.forEach((v: any) => {
				if (v.tags.includes('wcag22aa')) breakdown.wcag22aa.violations++;
				else if (v.tags.includes('wcag21aa')) breakdown.wcag21aa.violations++;
				else if (v.tags.includes('wcag2aa')) breakdown.wcag2aa.violations++;
			});

			sr.results.incomplete.forEach((inc: any) => {
				if (inc.tags.includes('wcag22aa')) breakdown.wcag22aa.incomplete++;
				else if (inc.tags.includes('wcag21aa')) breakdown.wcag21aa.incomplete++;
				else if (inc.tags.includes('wcag2aa')) breakdown.wcag2aa.incomplete++;
			});
		});

		return breakdown;
	}

	// Save JSON report
	const jsonFileName = `${sanitizedTestName}.json`;
	const jsonFilePath = path.join(testDir, jsonFileName);
	fs.writeFileSync(jsonFilePath, JSON.stringify(aggregatedResults, null, 2), 'utf-8');

	// Convert to SARIF format
	const sarifReport = convertAggregatedToSARIF(aggregatedResults);
	const sarifFileName = `${sanitizedTestName}.sarif`;
	const sarifFilePath = path.join(testDir, sarifFileName);
	fs.writeFileSync(sarifFilePath, JSON.stringify(sarifReport, null, 2), 'utf-8');

	console.log(`\nAccessibility reports saved:`);
	console.log(`  Test: ${testName}`);
	console.log(`  Directory: ${testDir}`);
	console.log(
		`  Summary: ${aggregatedResults.summary.totalViolations} violations across ${aggregatedResults.summary.totalSteps} steps`
	);

	// Clear results for this test
	testResults.delete(testKey);
}

/**
 * Converts aggregated results to SARIF format for Azure DevOps
 */
function convertAggregatedToSARIF(aggregatedResults: any): any {
	const allViolations = aggregatedResults.steps.flatMap((step: any) =>
		step.violations.flatMap((violation: any) =>
			violation.nodes.map((node: any) => ({
				ruleId: violation.id,
				level: mapImpactToLevel(violation.impact),
				message: {
					text: `[${step.stepName}] ${violation.help}: ${node.failureSummary || ''}`
				},
				locations: [
					{
						physicalLocation: {
							artifactLocation: {
								uri: step.url
							},
							region: {
								snippet: {
									text: node.html
								}
							}
						}
					}
				],
				properties: {
					stepName: step.stepName,
					target: node.target,
					xpath: node.xpath,
					impact: violation.impact,
					testHierarchy: aggregatedResults.testHierarchy
				}
			}))
		)
	);

	const allIncomplete = aggregatedResults.steps.flatMap((step: any) =>
		step.incomplete.flatMap((incomplete: any) =>
			incomplete.nodes.map((node: any) => ({
				ruleId: incomplete.id,
				level: 'note',
				message: {
					text: `[${step.stepName}] [INCOMPLETE] ${incomplete.help}: Needs manual review`
				},
				locations: [
					{
						physicalLocation: {
							artifactLocation: {
								uri: step.url
							},
							region: {
								snippet: {
									text: node.html
								}
							}
						}
					}
				],
				properties: {
					stepName: step.stepName,
					target: node.target,
					xpath: node.xpath,
					status: 'incomplete',
					testHierarchy: aggregatedResults.testHierarchy
				}
			}))
		)
	);

	// Collect unique rules
	const rulesMap = new Map();
	aggregatedResults.steps.forEach((step: any) => {
		[...step.violations, ...step.incomplete].forEach((item: any) => {
			if (!rulesMap.has(item.id)) {
				rulesMap.set(item.id, {
					id: item.id,
					shortDescription: { text: item.description },
					fullDescription: { text: item.help },
					helpUri: item.helpUrl,
					properties: {
						tags: item.tags,
						impact: item.impact
					}
				});
			}
		});
	});

	return {
		$schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
		version: '2.1.0',
		runs: [
			{
				tool: {
					driver: {
						name: 'axe-core',
						version: '4.10.3',
						informationUri: 'https://github.com/dequelabs/axe-core',
						rules: Array.from(rulesMap.values())
					}
				},
				properties: {
					testHierarchy: aggregatedResults.testHierarchy,
					summary: aggregatedResults.summary
				},
				results: [...allViolations, ...allIncomplete]
			}
		]
	};
}

/**
 * Maps axe-core impact levels to SARIF severity levels
 */
function mapImpactToLevel(impact: string): string {
	const mapping: { [key: string]: string } = {
		critical: 'error',
		serious: 'error',
		moderate: 'warning',
		minor: 'note'
	};
	return mapping[impact] || 'warning';
}
