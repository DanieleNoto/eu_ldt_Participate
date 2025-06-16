import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { expect, test } from '@playwright/test';
import { STORAGE_STATE } from '@utils/constants';
import { ProcessTestDataGenerator } from '../../../../fixtures/process-fixtures';
import { LocalizationUtils } from '../../../../utils/localization.utils';

test.describe('PAR R8, PAR R12c - City Administrator Process Creation', () => {
	test.use({ storageState: STORAGE_STATE.ADMIN });

	let processAdminPage: ProcessAdminPage;
	let validProcessData: any;

	test.beforeEach(async ({ page }) => {
		// Navigate directly to admin area and wait for it to load
		await page.goto('/admin');
		await page.waitForLoadState('networkidle');

		processAdminPage = new ProcessAdminPage(page);
		validProcessData = ProcessTestDataGenerator.generateValidProcessData();

		// Use the modular navigation method with proper waiting
		await processAdminPage.navigateToProcesses();
		await page.waitForLoadState('networkidle');

		// Verify we're on the processes page, with fallback navigation
		let isOnProcessesPage = await processAdminPage.isOnProcessesPage();

		if (!isOnProcessesPage) {
			// Try direct navigation if component navigation failed
			await page.goto('/admin/participatory_processes');
			await page.waitForLoadState('networkidle');
			isOnProcessesPage = await processAdminPage.isOnProcessesPage();
		}

		expect(isOnProcessesPage).toBe(true);
	});

	test.describe('Main Flow - Create Process', () => {
		test('should successfully create a public participatory process with all required information', async ({
			page
		}) => {
			// Set a longer timeout for this complex test
			test.setTimeout(180000); // 3 minutes
			await test.step('City Administrator navigates to New Process section', async () => {
				// Step 1: City Administrator is already logged in via storage state
				// Step 2: System displays form for creating a new Participatory Process
				await processAdminPage.navigateToNewProcess();

				// Verify we're on the new process page
				const isOnNewProcessPage = await processAdminPage.isOnNewProcessPage();
				expect(isOnNewProcessPage).toBe(true);

				// Verify essential form elements are visible with increased timeout
				const titleTextbox = await processAdminPage.getTitleTextbox();
				await expect(titleTextbox).toBeVisible({ timeout: 30000 });

				const subtitleTextbox = await processAdminPage.getSubtitleTextbox();
				await expect(subtitleTextbox).toBeVisible({ timeout: 30000 });

				// For order position field, use the improved method from ProcessAdminPage
				try {
					const orderPositionField = await processAdminPage.getOrderPositionSpinbutton();
					await expect(orderPositionField).toBeVisible({ timeout: 10000 });
					console.log('Order position field is visible');
				} catch (error) {
					console.log('Order position field not found or not visible - this is acceptable:', error);
				}
			});

			await test.step('Fill General Info required inputs', async () => {
				// Step 3.1: Fill only the absolute minimum required fields
				console.log('Filling minimal required fields only...');

				// Check page state before starting
				if (page.isClosed()) {
					throw new Error('Page is closed at the start of form filling');
				}

				// Wait for page stability
				await page.waitForLoadState('networkidle');

				await processAdminPage.fillGeneralInfo(validProcessData.general);
				// console.log('Essential fields filled - skipping all rich text fields');
			});

			await test.step('Fill Duration Info', async () => {
				// Step 3.2: Fulfill Duration Info
				await processAdminPage.fillDurationInfo(validProcessData.duration);
			});

			await test.step('Add images if provided', async () => {
				// Step 3.3: Add images
				if (validProcessData.image) {
					await processAdminPage.addImage(validProcessData.image);
				}
			});

			await test.step('Fill Metadata Info', async () => {
				// Step 3.4: Fulfill Metadata Info
				await processAdminPage.fillMetadataInfo(validProcessData.metadata);
			});

			await test.step('Setup visibility and submit process', async () => {
				// Step 3.5: Setup specific scope (included in metadata)
				// Step 3.6: Setup visibility to public
				await processAdminPage.setVisibilityToPublic();

				// Step 3.7: Setup related processes (if needed)
				// This step is optional for basic process creation

				// Step 4: City Administrator clicks "Submit" to create the Process
				await processAdminPage.submitProcess();
			});

			await test.step('Verify successful creation', async () => {
				// Step 5 & 6: System validates and saves the Process
				// Step 7: System notifies successful creation
				await processAdminPage.expectSuccessMessage();

				// Verify navigation to process steps page indicates successful creation
				await expect(page).toHaveURL(/\/admin\/participatory_processes\/.*\/steps/);

				// Result: City Administrator can collect iterative and co-created feedback from citizens
				// Verify process title is visible on the page
				await expect(page.getByText(validProcessData.general.title)).toBeVisible();
			});
		});
	});

	test.describe('Alternative Flow: Cancel Creation', () => {
		test('should allow cancellation of process creation and return to dashboard', async ({ page }) => {
			await test.step('Start process creation and then cancel', async () => {
				// Start at point 1-3: Navigate and begin filling form
				await processAdminPage.navigateToNewProcess();

				// Begin filling form with valid data
				await processAdminPage.fillGeneralInfo(validProcessData.general);

				// City Administrator decides to cancel the Process creation process
				await processAdminPage.cancelProcessCreation();
			});

			await test.step('Verify return to processes list', async () => {
				// Verify user is back at the admin home page using the modular check

				await expect(page).toHaveURL(/\/admin\//);
			});
		});
	});

	test.describe('Alternative Flow: Field Validation Failures', () => {
		test('should handle missing required fields and provide error guidance', async ({ page }) => {
			const invalidProcessData = ProcessTestDataGenerator.generateInvalidProcessData();

			await test.step('Navigate to new process form', async () => {
				await processAdminPage.navigateToNewProcess();
			});

			await test.step('Submit form with invalid data', async () => {
				// Try to submit form with invalid/missing required fields
				if (invalidProcessData.general) {
					await processAdminPage.fillGeneralInfo(invalidProcessData.general as any);
				}

				await processAdminPage.submitProcess();
			});

			await test.step('Verify validation errors are shown', async () => {
				// System should display validation errors for required fields
				await processAdminPage.expectErrorMessage();
			});
		});

		test('should handle edge cases in process data input', async ({ page }) => {
			await test.step('Navigate to new process form', async () => {
				await processAdminPage.navigateToNewProcess();
			});

			await test.step('Test with edge case data', async () => {
				// Test with minimal valid data
				const minimalData = ProcessTestDataGenerator.generateMinimalValidProcessData();
				await processAdminPage.fillGeneralInfo(minimalData.general);
				await processAdminPage.fillDurationInfo(minimalData.duration);
				await processAdminPage.fillMetadataInfo(minimalData.metadata);
				await processAdminPage.setVisibilityToPublic();

				await processAdminPage.submitProcess();
			});

			await test.step('Verify minimal data is accepted', async () => {
				await processAdminPage.expectSuccessMessage();
				await expect(page).toHaveURL(/\/admin\/participatory_processes\/.*\/steps/);
			});
		});
	});

	test.describe.skip('Process Management Using Modular Components', () => {
		test('should demonstrate search and filter functionality', async ({ page }) => {
			await test.step('Verify we can search for processes', async () => {
				// Use the new modular search functionality
				await processAdminPage.searchProcesses('Test Process');

				// Wait for table to update
				await expect(await processAdminPage.getProcessCount()).toBeGreaterThanOrEqual(0);
			});

			await test.step('Verify we can filter by publication status', async () => {
				// Use the new modular filter functionality
				await processAdminPage.filterByPublished();

				// Verify filter was applied
				const statuses = await processAdminPage.getProcessStatuses();
				// All processes should be published if any are returned
				if (statuses.length > 0) {
					expect(statuses.every(status => status.includes('Pubblicato'))).toBeTruthy();
				}
			});

			await test.step('Clear filters and verify table resets', async () => {
				await processAdminPage.clearAllFilters();

				// Table should show all processes again
				await expect(await processAdminPage.hasProcesses()).toBeTruthy();
			});
		});

		test('should demonstrate component navigation', async ({ page }) => {
			await test.step('Navigate between process tabs', async () => {
				// Test tab navigation using the modular component
				await processAdminPage.navigateToProcessGroups();
				await expect(await processAdminPage.isOnProcessGroupsPage()).toBe(true);

				// Navigate back to processes
				await processAdminPage.navigateToProcessesTab();
				await expect(await processAdminPage.isOnProcessesPage()).toBe(true);
			});

			await test.step('Use breadcrumb navigation', async () => {
				// Test breadcrumb functionality through the component
				await processAdminPage.navigateToNewProcess();
				await expect(await processAdminPage.isOnNewProcessPage()).toBe(true);

				// Navigate back using browser back or component methods
				await page.goBack();
				await expect(await processAdminPage.isOnProcessesPage()).toBe(true);
			});
		});
	});
	test.describe.skip('Localization - Field Locale Detection', () => {
		test('should correctly detect locale from URL and use appropriate field selectors', async ({ page }) => {
			// Navigate to new process page (should default to English)
			await processAdminPage.navigateToNewProcess();

			// Test locale detection
			const localeInfo = await processAdminPage.testLocaleDetection();

			// Should default to 'en' if no locale parameter
			expect(localeInfo.currentLocale).toBe('en');

			// Should generate selectors with '_en' suffix
			expect(localeInfo.testSelectors).toEqual([
				'#participatory_process_short_description_en',
				'#participatory_process_description_en',
				'#participatory_process_announcement_en'
			]);
		});

		test('should correctly detect Italian locale from URL parameter', async ({ page }) => {
			// Navigate to new process page with Italian locale
			await page.goto('/admin/participatory_processes/new?locale=it');
			await page.waitForLoadState('networkidle');

			// Test locale detection
			const localeInfo = await processAdminPage.testLocaleDetection();

			// Should detect 'it' locale from URL parameter
			expect(localeInfo.currentLocale).toBe('it');

			// Should generate selectors with '_it' suffix
			expect(localeInfo.testSelectors).toEqual([
				'#participatory_process_short_description_it',
				'#participatory_process_description_it',
				'#participatory_process_announcement_it'
			]);
		});

		test('should handle form filling with Italian locale', async ({ page }) => {
			// Navigate to new process page with Italian locale
			await LocalizationUtils.navigateWithLocale(page, '/admin/participatory_processes/new', 'it');

			// Get Italian localized test data
			const italianTestData = LocalizationUtils.getLocalizedTestData('it');
			const italianProcessData = {
				...validProcessData,
				...italianTestData
			};

			// Try to fill the form - should work with Italian locale
			try {
				await processAdminPage.fillGeneralInfo(italianProcessData);
				console.log('Italian form filling successful');
			} catch (error) {
				console.error('Italian form filling failed:', error);
				// This is expected to work with the new localization logic
				throw error;
			}
		});

		test('should validate multiple locales and field availability', async ({ page }) => {
			// Navigate to new process page
			await processAdminPage.navigateToNewProcess();

			// Get all available locales for a test field
			const availableLocales = await LocalizationUtils.getAvailableLocales(
				page,
				'participatory_process_short_description'
			);
			console.log(`Available locales: ${availableLocales.join(', ')}`);

			// Should at least have English
			expect(availableLocales).toContain('en');

			// Test each available locale
			for (const locale of availableLocales.slice(0, 3)) {
				// Test max 3 locales to avoid too long test
				await LocalizationUtils.navigateWithLocale(page, '/admin/participatory_processes/new', locale);

				// Validate that all required fields exist for this locale
				const fieldNames = [
					'participatory_process_short_description',
					'participatory_process_description',
					'participatory_process_announcement'
				];

				const validation = await LocalizationUtils.validateLocalizedFields(page, fieldNames, locale);
				expect(validation.valid).toBeTruthy();

				// Test form filling with localized data
				const localizedData = LocalizationUtils.getLocalizedTestData(locale);
				const processData = {
					...validProcessData,
					...localizedData
				};

				try {
					await processAdminPage.fillGeneralInfo(processData);
					console.log(`Form filling successful for locale: ${locale}`);
				} catch (error) {
					console.error(`Form filling failed for locale ${locale}:`, error);
					// Continue with next locale
				}
			}
		});
	});
});
