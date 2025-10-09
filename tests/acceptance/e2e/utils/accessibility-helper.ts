import { Page, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Analyzes accessibility violations on the current page
 * Checks WCAG 2.0, 2.1, and 2.2 Level AA compliance
 * @param page - The Playwright page to analyze
 */
export async function analyzeAccessibility(page: Page): Promise<void> {
	console.log(`\nRunning accessibility analysis on: ${page.url()}`);

	const accessibilityScanResults = await new AxeBuilder({ page })
		.withTags(['wcag2aa', 'wcag21aa', 'wcag22aa'])
		.analyze();

	const { violations, passes, incomplete } = accessibilityScanResults;

	// Separate violations by WCAG version
	const wcag20And21Violations = violations.filter(
		v => v.tags.some(tag => tag === 'wcag2aa' || tag === 'wcag21aa') && !v.tags.some(tag => tag === 'wcag22aa')
	);

	const wcag22OnlyViolations = violations.filter(
		v => v.tags.includes('wcag22aa') && !v.tags.some(tag => tag === 'wcag2aa' || tag === 'wcag21aa')
	);

	const mixedViolations = violations.filter(
		v => v.tags.includes('wcag22aa') && v.tags.some(tag => tag === 'wcag2aa' || tag === 'wcag21aa')
	);

	// Log summary
	console.log(`\nAccessibility Test Results:`);
	console.log(`   Passed rules: ${passes.length}`);
	console.log(`   Incomplete rules: ${incomplete.length}`);
	console.log(`   Total violations found: ${violations.length}`);

	// Show CRITICAL violations (WCAG 2.0/2.1) with FULL details
	if (wcag20And21Violations.length > 0 || mixedViolations.length > 0) {
		const criticalCount = wcag20And21Violations.length + mixedViolations.length;
		console.error(`\nWCAG 2.0/2.1 AA violations (CRITICAL): ${criticalCount}`);
		console.error('   These violations will FAIL the test\n');

		[...wcag20And21Violations, ...mixedViolations].forEach((violation, index) => {
			const wcagTags = violation.tags.filter(t => t.startsWith('wcag')).join(', ');
			console.error(`   ${index + 1}. ${violation.id}: ${violation.description}`);
			console.error(`      Impact: ${violation.impact}`);
			console.error(`      WCAG: ${wcagTags}`);
			console.error(`      Elements affected: ${violation.nodes.length}`);
			console.error(`      Help: ${violation.helpUrl}\n`);
		});
	}

	// Show WCAG 2.2 only violations - SIMPLE list (informational only)
	if (wcag22OnlyViolations.length > 0) {
		console.warn(`\nWCAG 2.2 AA only violations: ${wcag22OnlyViolations.length}`);
		console.warn('   These are warnings only - test will still PASS\n');
		wcag22OnlyViolations.forEach((violation, index) => {
			console.warn(`   ${index + 1}. ${violation.id}: ${violation.description}`);
			console.warn(`      Impact: ${violation.impact}`);
			console.warn(`      Help: ${violation.helpUrl}\n`);
		});
	}

	// Final status
	if (violations.length === 0) {
		console.log('\nNo WCAG violations detected - All accessibility checks passed!');
	} else if (wcag20And21Violations.length === 0 && mixedViolations.length === 0) {
		console.log('\nWCAG 2.1 AA compliance achieved - Test PASSED');
		console.log('   (WCAG 2.2 violations are informational only)');
	}

	// Only fail if there are WCAG 2.0 or 2.1 violations
	const criticalViolations = [...wcag20And21Violations, ...mixedViolations];
	expect(criticalViolations).toEqual([]);
}
