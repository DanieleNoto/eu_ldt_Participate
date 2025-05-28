import { test as base } from '@playwright/test';
import {
	AdminConfigPage,
	CompleteProcessData,
	ProcessGeneralInfo,
	ProcessDurationInfo,
	ProcessMetadataInfo
} from '../pages/AdminConfigPage';
import path from 'path';

// Extend the base test to include our fixtures
type TestFixtures = {
	adminProcessPage: AdminConfigPage;
	loggedInAdminProcessPage: AdminConfigPage;
	validProcessData: CompleteProcessData;
	invalidProcessData: Partial<CompleteProcessData>;
	privateProcessData: CompleteProcessData;
};

export const test = base.extend<TestFixtures>({
	// Fixture that provides a fresh AdminConfigPage instance
	adminProcessPage: async ({ page }, use) => {
		const adminProcessPage = new AdminConfigPage(page);
		await use(adminProcessPage);
	},

	// Fixture that provides a logged-in admin page ready for process creation
	loggedInAdminProcessPage: async ({ page }, use) => {
		const adminProcessPage = new AdminConfigPage(page);

		// Perform login sequence
		await adminProcessPage.navigateToHomePage();
		await adminProcessPage.clickLoginLink();
		await adminProcessPage.navigateToSignIn();
		await adminProcessPage.acceptCookies();
		await adminProcessPage.loginAsAdmin();
		await adminProcessPage.navigateToAdminDashboard();
		await adminProcessPage.navigateToProcesses();

		await use(adminProcessPage);
	},

	// Fixture that provides invalid test data for validation testing
	invalidProcessData: async ({}, use) => {
		const invalidData: Partial<CompleteProcessData> = {
			general: {
				title: '', // Empty required field
				subtitle: 'Test Subtitle',
				orderPosition: -1, // Invalid position
				urlSlug: 'invalid slug with spaces', // Invalid URL slug
				shortDescription: '',
				hashtag: '',
				description: '',
				announcement: ''
			},
			duration: {
				startDate: '32/13/2025', // Invalid date
				endDate: '01/01/2020' // End date before start date
			}
		};
		await use(invalidData);
	}
});

export { expect } from '@playwright/test';

// Test data generators for different scenarios
export class ProcessTestDataGenerator {
	static generateValidProcessData(uniqueId: string = Date.now().toString()): CompleteProcessData {
		return {
			general: {
				title: `Test Process ${uniqueId}`,
				subtitle: `Subtitle for Process ${uniqueId}`,
				orderPosition: parseInt(uniqueId.slice(-2)) || 1,
				urlSlug: `test-process-${uniqueId}`,
				shortDescription: `Short description for test process ${uniqueId}`,
				hashtag: `TestProcess${uniqueId}`,
				description: `Detailed description for test process ${uniqueId}. This process will test various feedback mechanisms.`,
				announcement: `Test announcement for process ${uniqueId}`
			},
			duration: {
				startDate: '01/06/2025',
				endDate: '30/06/2025'
			},
			metadata: {
				developerGroup: `Test Group ${uniqueId}`,
				localArea: `Test Area ${uniqueId}`,
				metaScope: `Test Scope ${uniqueId}`,
				target: `Test Target ${uniqueId}`,
				participatoryScope: `Test Participatory Scope ${uniqueId}`,
				participatoryStructure: `Test Structure ${uniqueId}`
			},
			visibility: 'public'
		};
	}

	static generateInvalidProcessData(): Partial<CompleteProcessData> {
		return {
			general: {
				title: '', // Missing required field
				subtitle: 'Test',
				orderPosition: -1,
				urlSlug: '', // Missing required field
				shortDescription: '',
				hashtag: '',
				description: '',
				announcement: ''
			}
		};
	}

	static generateMinimalValidProcessData(): CompleteProcessData {
		const uniqueId = Date.now().toString();
		return {
			general: {
				title: `Minimal Process ${uniqueId}`,
				subtitle: 'Minimal Subtitle',
				orderPosition: 1,
				urlSlug: `minimal-process-${uniqueId}`,
				shortDescription: 'Minimal description',
				hashtag: 'Minimal',
				description: 'Minimal detailed description',
				announcement: 'Minimal announcement'
			},
			duration: {
				startDate: '01/06/2025',
				endDate: '02/06/2025'
			},
			metadata: {
				developerGroup: 'Minimal Group',
				localArea: 'Minimal Area',
				metaScope: 'Minimal Scope',
				target: 'Minimal Target',
				participatoryScope: 'Minimal Participatory Scope',
				participatoryStructure: 'Minimal Structure'
			},
			visibility: 'public'
		};
	}
}
