/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 * Denise Scarcelli
 */

import { Page, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { promises as fs } from 'fs';
import * as path from 'path';

function safeFileName(name: string): string {
	return name.replace(/[^\w\d-_\.]/g, '_').slice(0, 200);
}

const OUT_DIR = path.resolve(process.cwd(), 'a11y-reports');

export async function analyzeAccessibility(page: Page, stepName?: string): Promise<void> {
	const startedAt = new Date().toISOString();
	console.log(`\n[${startedAt}] Running accessibility analysis on: ${page.url()}`);

	// create context name using optional stepName or fallback to URL+timestamp
	const contextBase = stepName ? `${stepName}` : `${page.url().replace(/[:\/?#&=]/g, '_')}`;
	const contextNameTimestamped = safeFileName(`${contextBase}_${Date.now()}`);
	const contextNameLatest = stepName ? safeFileName(`${stepName}__latest`) : null;

	let accessibilityScanResults: any;
	try {
		accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(['wcag2aa', 'wcag21aa', 'wcag22aa'])
			.analyze();
	} catch (err) {
		console.error(`\n[${new Date().toISOString()}] Accessibility analysis failed to run:`, err);
		try {
			await fs.mkdir(OUT_DIR, { recursive: true });
			const errFile = path.join(OUT_DIR, `${contextNameTimestamped}_error.txt`);
			await fs.writeFile(
				errFile,
				`A11y run failed: ${String(err)}\nURL: ${page.url()}\nTime: ${new Date().toISOString()}`,
				'utf8'
			);
		} catch (_) {
			/* ignore */
		}
		throw err;
	}

	const { violations = [], passes = [], incomplete = [] } = accessibilityScanResults || {};

	// ensure outdir and save artifacts
	try {
		await fs.mkdir(OUT_DIR, { recursive: true });

		// Save only the "latest" artifact per stepName (overwritten each run for same step)
		// If no stepName provided, save timestamped artifact for history
		if (contextNameLatest) {
			try {
				await fs.writeFile(
					path.join(OUT_DIR, `${contextNameLatest}.json`),
					JSON.stringify(accessibilityScanResults, null, 2),
					'utf8'
				);
			} catch (e) {
				console.warn('Failed to write latest artifact', e);
			}
		} else {
			// Only save timestamped if no stepName (fallback to URL)
			const tsBase = `${contextNameTimestamped}`;
			await fs.writeFile(
				path.join(OUT_DIR, `${tsBase}.json`),
				JSON.stringify(accessibilityScanResults, null, 2),
				'utf8'
			);
		}
	} catch (artErr) {
		console.warn('Failed to save accessibility artifacts', artErr);
	}

	// Separate violations by WCAG version
	const wcag20And21Violations = violations.filter(
		(v: any) =>
			Array.isArray(v.tags) &&
			v.tags.some((tag: string) => tag === 'wcag2aa' || tag === 'wcag21aa') &&
			!v.tags.some((tag: string) => tag === 'wcag22aa')
	);

	const wcag22OnlyViolations = violations.filter(
		(v: any) =>
			Array.isArray(v.tags) &&
			v.tags.includes('wcag22aa') &&
			!v.tags.some((tag: string) => tag === 'wcag2aa' || tag === 'wcag21aa')
	);

	const mixedViolations = violations.filter(
		(v: any) =>
			Array.isArray(v.tags) &&
			v.tags.includes('wcag22aa') &&
			v.tags.some((tag: string) => tag === 'wcag2aa' || tag === 'wcag21aa')
	);

	// Log summary
	console.log(`\nAccessibility Test Results:`);
	console.log(`   Passed rules: ${passes.length}`);
	console.log(`   Incomplete rules: ${incomplete.length}`);
	console.log(`   Total violations found: ${violations.length}`);

	if (wcag20And21Violations.length > 0 || mixedViolations.length > 0) {
		const criticalCount = wcag20And21Violations.length + mixedViolations.length;
		console.error(`\nWCAG 2.0/2.1 AA violations (CRITICAL): ${criticalCount}`);
		console.error('   These violations will FAIL the test\n');

		[...wcag20And21Violations, ...mixedViolations].forEach((violation: any, index: number) => {
			const wcagTags = Array.isArray(violation.tags)
				? violation.tags.filter((t: string) => t.startsWith('wcag')).join(', ')
				: 'n/a';
			const nodesCount = Array.isArray(violation.nodes) ? violation.nodes.length : 0;
			console.error(`   ${index + 1}. ${violation.id}: ${violation.description}`);
			console.error(`      Impact: ${violation.impact}`);
			console.error(`      WCAG: ${wcagTags}`);
			console.error(`      Elements affected: ${nodesCount}`);
			console.error(`      Help: ${violation.helpUrl}\n`);
		});
	}

	if (wcag22OnlyViolations.length > 0) {
		console.warn(`\nWCAG 2.2 AA only violations: ${wcag22OnlyViolations.length}`);
		console.warn('   These are warnings only - test will still PASS\n');
		wcag22OnlyViolations.forEach((violation: any, index: number) => {
			console.warn(`   ${index + 1}. ${violation.id}: ${violation.description}`);
			console.warn(`      Impact: ${violation.impact}`);
			console.warn(`      Help: ${violation.helpUrl}\n`);
		});
	}

	if (violations.length === 0) {
		console.log('\nNo WCAG violations detected - All accessibility checks passed!');
	} else if (wcag20And21Violations.length === 0 && mixedViolations.length === 0) {
		console.log('\nWCAG 2.1 AA compliance achieved - Test PASSED');
		console.log('   (WCAG 2.2 violations are informational only)');
	}

	const criticalViolations = [...wcag20And21Violations, ...mixedViolations];
	expect(criticalViolations).toEqual([]);
}

/**
 * Removes duplicate timestamped scans per stepName, keeping only the latest.
 */
async function pruneOldScansKeepLatest(): Promise<void> {
	try {
		const files = await fs.readdir(OUT_DIR).catch(() => []);
		const jsonFiles = files.filter(f => f.endsWith('.json'));

		const buckets: Record<string, { file: string; ts: number | null }[]> = {};

		for (const jf of jsonFiles) {
			// match <canonical>_<timestamp>.json where timestamp is numeric suffix
			const m = jf.match(/^(.*)_([0-9]{10,})\.json$/);
			if (m) {
				const canonical = m[1];
				const ts = Number(m[2]);
				buckets[canonical] = buckets[canonical] || [];
				buckets[canonical].push({ file: jf, ts });
			} else {
				const nameNoExt = jf.replace(/\.json$/, '');
				buckets[nameNoExt] = buckets[nameNoExt] || [];
				buckets[nameNoExt].push({ file: jf, ts: null });
			}
		}

		const toDelete: string[] = [];
		for (const canonical of Object.keys(buckets)) {
			const items = buckets[canonical];
			if (items.length <= 1) continue;
			const withTs = items.filter(i => i.ts !== null) as { file: string; ts: number }[];
			if (withTs.length > 0) {
				// Delete all timestamped files, keep only __latest if it exists
				withTs.forEach(i => toDelete.push(i.file));
			} else {
				items.sort((a, b) => a.file.localeCompare(b.file));
				items.slice(0, -1).forEach(i => toDelete.push(i.file));
			}
		}

		for (const d of toDelete) {
			try {
				await fs.unlink(path.join(OUT_DIR, d));
				console.log(`Pruned old a11y file: ${d}`);
			} catch (e) {
				console.warn(`Failed to delete ${d}`, e);
			}
		}
	} catch (err) {
		console.warn('pruneOldScansKeepLatest: failed', err);
	}
}

/**
 * Aggregates basic counts from per-scan JSONs into summary.json (or custom summary-{prefix}.json)
 * and prunes older scans keeping only the latest per stepName.
 * @param summaryPrefix - Optional prefix for the summary filename (e.g., 'admin' produces 'summary-admin.json')
 */
export async function saveAccessibilityResults(summaryPrefix?: string): Promise<void> {
	try {
		// prune older timestamped scans, then aggregate what's left
		await fs.mkdir(OUT_DIR, { recursive: true });
		await pruneOldScansKeepLatest();

		const files = await fs.readdir(OUT_DIR).catch(() => []);
		const jsonFiles = files.filter(f => f.endsWith('.json'));

		const summaries: { file: string; violations: number; wcag20_21: number; wcag22_only: number }[] = [];

		for (const jf of jsonFiles) {
			try {
				const raw = await fs.readFile(path.join(OUT_DIR, jf), 'utf8');
				const data = JSON.parse(raw);
				const violations = Array.isArray(data.violations) ? data.violations.length : 0;
				const wcag20_21 = Array.isArray(data.violations)
					? data.violations.filter(
							(v: any) =>
								Array.isArray(v.tags) && (v.tags.includes('wcag2aa') || v.tags.includes('wcag21aa'))
						).length
					: 0;
				const wcag22_only = violations - wcag20_21;
				summaries.push({ file: jf, violations, wcag20_21, wcag22_only });
			} catch (_) {
				/* ignore invalid json */
			}
		}

		const aggregate = {
			generatedAt: new Date().toISOString(),
			totalScans: summaries.length,
			totalViolations: summaries.reduce((s, x) => s + x.violations, 0),
			totalWCAG20_21: summaries.reduce((s, x) => s + x.wcag20_21, 0),
			totalWCAG22Only: summaries.reduce((s, x) => s + x.wcag22_only, 0),
			details: summaries
		};

		const summaryFilename = summaryPrefix ? `summary-${summaryPrefix}.json` : 'summary.json';
		await fs.writeFile(path.join(OUT_DIR, summaryFilename), JSON.stringify(aggregate, null, 2), 'utf8');
		console.log(`Accessibility summary written to ${path.join(OUT_DIR, summaryFilename)}`);
	} catch (err) {
		console.warn('saveAccessibilityResults: failed to aggregate results', err);
	}
}
