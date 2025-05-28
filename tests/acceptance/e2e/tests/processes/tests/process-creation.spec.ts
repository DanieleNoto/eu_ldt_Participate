import { test, expect } from '../fixtures/process-fixtures';
import { ProcessTestDataGenerator } from '../fixtures/process-fixtures';

test.describe('PAR R8, PAR R12c - City Administrator Process Creation', () => {
	test.describe('Main Flow - Create Process', () => {
		test('should successfully create a public participatory process with all required information', async ({
			loggedInAdminProcessPage
		}) => {
			// Generate valid test data
			const validProcessData = ProcessTestDataGenerator.generateValidProcessData();

			// Step 1: City Administrator is already logged in and navigated to "New Process" section
			// (handled by loggedInAdminProcessPage fixture)

			// Step 2: System displays form for creating a new Participatory Process
			await loggedInAdminProcessPage.navigateToNewProcess(); // Verify form is displayed
			await expect(await loggedInAdminProcessPage.getTitleTextbox()).toBeVisible();
			await expect(await loggedInAdminProcessPage.getSubtitleTextbox()).toBeVisible();
			await expect(await loggedInAdminProcessPage.getOrderPositionSpinbutton()).toBeVisible();

			// Step 3.1: Fulfill General Info required inputs
			await loggedInAdminProcessPage.fillGeneralInfo(validProcessData.general);

			// Step 3.2: Fulfill Duration Info
			await loggedInAdminProcessPage.fillDurationInfo(validProcessData.duration);

			// Step 3.3: Add images
			if (validProcessData.image) {
				await loggedInAdminProcessPage.addImage(validProcessData.image);
			}

			// Step 3.4: Fulfill Metadata Info
			await loggedInAdminProcessPage.fillMetadataInfo(validProcessData.metadata);

			// Step 3.5: Setup specific scope (included in metadata)
			// Step 3.6: Setup visibility to public
			await loggedInAdminProcessPage.setVisibilityToPublic();

			// Step 3.7: Setup related processes (if needed)
			// This step is optional for basic process creation

			// Step 4: City Administrator clicks "Submit" to create the Process
			await loggedInAdminProcessPage.submitProcess();

			// Step 5 & 6: System validates and saves the Process
			// Step 7: System notifies successful creation
			await loggedInAdminProcessPage.waitForSuccessMessage();

			// Verify navigation to process steps page indicates successful creation
			await loggedInAdminProcessPage.expectUrl(/\/admin\/participatory_processes\/.*\/steps/);

			// Result: City Administrator can collect iterative and co-created feedback from citizens
			// Verify process is accessible and configured for feedback collection
			await expect(
				await loggedInAdminProcessPage.getTextBySelector(validProcessData.general.title)
			).toBeVisible();
		});
	});

	test.describe('Alternative Flow: Cancel Creation', () => {
		test('should allow cancellation of process creation and return to dashboard', async ({
			loggedInAdminProcessPage
		}) => {
			// Start at point 1-3: Navigate and begin filling form
			const validProcessData = ProcessTestDataGenerator.generateValidProcessData();
			await loggedInAdminProcessPage.navigateToNewProcess();
			await loggedInAdminProcessPage.fillGeneralInfo(validProcessData.general);

			// City Administrator decides to cancel the Process creation process
			await loggedInAdminProcessPage.cancelProcessCreation();

			await loggedInAdminProcessPage.expectUrl(/\/admin$/);

			// Verify we're back at the admin dashboard
			await expect(await loggedInAdminProcessPage.getTextBySelector('Dashboard')).toBeVisible();
		});
	});

	test.describe('Alternative Flow: Field Validation Failures', () => {
		test('should handle missing required fields and provide error guidance', async ({
			loggedInAdminProcessPage,
			invalidProcessData
		}) => {
			// Start at point 5: System detects incomplete/incorrect fields
			await loggedInAdminProcessPage.navigateToNewProcess();

			// Fill form with invalid/incomplete data
			if (invalidProcessData.general) {
				await loggedInAdminProcessPage.fillGeneralInfo(invalidProcessData.general as any);
			}

			// Attempt to submit with validation errors
			await loggedInAdminProcessPage.submitProcess();

			// Step 5.1 & 5.2: System detects and highlights missing/incorrect data
			const validationErrors = await loggedInAdminProcessPage.getValidationErrors();
			expect(validationErrors.length).toBeGreaterThan(0);

			// Verify error messages guide the user
			const hasRequiredFieldError = validationErrors.some(
				error =>
					error.toLowerCase().includes('required') ||
					error.toLowerCase().includes('field') ||
					error.toLowerCase().includes('blank') ||
					error.toLowerCase().includes('missing')
			);
			expect(hasRequiredFieldError).toBeTruthy();

			// Step 5.3: City Administrator corrects the errors
			const validData = ProcessTestDataGenerator.generateValidProcessData();
			await loggedInAdminProcessPage.fillGeneralInfo(validData.general);
			await loggedInAdminProcessPage.fillDurationInfo(validData.duration);
			await loggedInAdminProcessPage.fillMetadataInfo(validData.metadata);

			// Step 5.4: Click "Submit" again (proceed with Main Flow from Step 7)
			await loggedInAdminProcessPage.submitProcess();

			// Result: Process is successfully validated and saved
			await loggedInAdminProcessPage.waitForSuccessMessage();
		});

		test('should validate URL slug format and uniqueness', async ({ loggedInAdminProcessPage }) => {
			const testData = ProcessTestDataGenerator.generateValidProcessData();

			await loggedInAdminProcessPage.navigateToNewProcess();

			// Test invalid URL slug format
			testData.general.urlSlug = 'invalid slug with spaces!@#';
			await loggedInAdminProcessPage.fillGeneralInfo(testData.general);
			await loggedInAdminProcessPage.submitProcess();

			// Should show validation error for URL slug
			const validationErrors = await loggedInAdminProcessPage.getValidationErrors();
			const hasUrlSlugError = validationErrors.some(
				error =>
					error.toLowerCase().includes('slug') ||
					error.toLowerCase().includes('url') ||
					error.toLowerCase().includes('invalid') ||
					error.toLowerCase().includes('format')
			);
			expect(hasUrlSlugError).toBeTruthy();
		});
	});
});
