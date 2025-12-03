/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denis Vasilev Dimchev
 */

import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { UpdateProcessAdminPage } from '@pages/pages/admin/processes/detail/UpdateProcessAdminPage';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';

/**
 * Attempts to find (within first maxProcesses) a process that contains a meetings component.
 * Navigates into the process edit view and then to Components section when found.
 * Returns true if such a process is found and navigated to, else false.
 */
export async function findProcessWithMeetings(
	adminHomePage: AdminHomePage,
	processAdminPage: ProcessAdminPage,
	updateProcessAdminPage: UpdateProcessAdminPage,
	componentsPage: ComponentsPage,
	options: { maxProcesses?: number } = {}
): Promise<boolean> {
	const { maxProcesses = 5 } = options;

	// Ensure we are on processes page
	await adminHomePage.navigateViaAdminNav('processes');
	await processAdminPage.waitForLoadState('networkidle');

	const processCount = await processAdminPage.getProcessCount();
	const limit = Math.min(processCount, maxProcesses);

	for (let i = 0; i < limit; i++) {
		try {
			if (i > 0) {
				await adminHomePage.navigateViaAdminNav('processes');
				await processAdminPage.waitForLoadState('networkidle');
			}

			await processAdminPage.processTable.editProcess(await getProcessNameAtIndex(processAdminPage, i));
			await processAdminPage.getPage().waitForLoadState('networkidle');

			await updateProcessAdminPage.navigateToComponents();
			await componentsPage.waitForComponentsPageLoad();

			const components = await componentsPage.getComponentTypes();
			const hasMeetings = components.some(type => type.toLowerCase().includes('meeting'));
			if (hasMeetings) {
				return true;
			}
		} catch (error: any) {
			console.log(`Error checking process at index ${i}:`, error.message);
			continue;
		}
	}
	return false;
}

export async function getProcessNameAtIndex(processAdminPage: ProcessAdminPage, index: number): Promise<string> {
	const processTitles = await processAdminPage.processTable.getProcessTitles();
	return processTitles[index] || `Process ${index}`;
}
