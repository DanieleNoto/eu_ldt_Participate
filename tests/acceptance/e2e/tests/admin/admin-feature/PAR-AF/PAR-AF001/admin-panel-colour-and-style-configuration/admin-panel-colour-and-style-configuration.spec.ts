/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { test, expect } from '@fixtures/parallel-test';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { DecidimAwesomeAdminPage } from '@pages/pages/admin/DecidimAwesomeAdminPage';

/**
 * Allows administrators to customize admin style CSS at runtime.
 * User Story: As an Administrator, I want to configure the colour scheme and style of the admin panel using CSS, so that I can customize the interface to align with organizational branding or improve usability.
 * Requirements: PAR R10
 * Prerequisites:
 * - The administrator has an active account on the platform and is logged in.
 * - The admin panel has access to a CSS configuration module for style updates.
 */

test.describe('[PAR-AF001] – Admin panel colour and style configuration', () => {
	let adminHomePage: AdminHomePage;
	let decidimAwesomeAdminPage: DecidimAwesomeAdminPage;

	test.beforeEach(async ({ adminPage }) => {
		adminHomePage = new AdminHomePage(adminPage);
		decidimAwesomeAdminPage = new DecidimAwesomeAdminPage(adminPage);
		await adminHomePage.navigateToAdminHomePage();
	});

	test.describe('Main Flow', () => {
		test('should configure the colour scheme and style of the admin panel', async ({ adminPage }) => {
			await test.step('1. User: Navigates to the "Settings -> Custom style -> Admin Panel" section of the admin panel.', async () => {
				await adminHomePage.navigateToDecidimAwesome();

				await expect(adminPage).toHaveURL(/.*\/admin\/decidim_awesome\/config\/editors/);

				await decidimAwesomeAdminPage.navigateToCustomStyles();
				await decidimAwesomeAdminPage.navigateToAdminPanelConfig();
			});

			await test.step('2. System: The system displays the appearance configuration interface', async () => {
				await expect(decidimAwesomeAdminPage.tweaksHeading).toBeVisible();
				await expect(decidimAwesomeAdminPage.cssVariablesText).toBeVisible();
			});

			await test.step('3. User: clicks on Add a new "admin panel" CSS box link/button', async () => {
				await decidimAwesomeAdminPage.clickAddNewCssBox();

				await expect(decidimAwesomeAdminPage.cssBoxCreatedMessage).toBeVisible();
			});

			await test.step('4. System: The system opens a CSS editor with options for configuring styles.', async () => {
				await expect(decidimAwesomeAdminPage.cssEditor).toBeVisible();
			});

			await test.step('5. User: Edits CSS variables or directly modifies styles', async () => {
				const cssContent = `/* ====== GENERAL BACKGROUNDS ====== */
.title-bar {
  background-color: #28A745 !important;
  color: #FCFDFD !important;
}

.process-title {
  background-color: rgb(25, 45, 69) !important;
}

.layout-nav,
.layout-nav * {
  background-color: rgb(25, 45, 69) !important;
}

.layout-nav li a:hover {
  background-color: #1F3B5A !important;
}

/* ===========================
   GENERAL FONT
   =========================== */

body, p, li, span, a {
  font-size: 1.05em !important;
  font-family: "Roboto", "Open Sans", Arial, sans-serif !important;
}

h1, h2, h3, h4, h5, h6 {
  font-family: "Roboto", "Open Sans", Arial, sans-serif !important;
  font-size: 1.05em !important;
}

.title-bar, 
.title-bar span, 
.title-bar a {
  font-size: 1.05em !important;
  font-family: "Roboto", "Open Sans", Arial, sans-serif !important;
}

.button, 
button,
input[type="submit"], 
input[type="button"],
.button__sm,
.dropdown__trigger,
.button__site {
  font-size: 1.1em !important;
  font-family: "Roboto", "Open Sans", Arial, sans-serif !important;
}

.tool-bar .button__site {
 color: #FCFDFD !important;
}

button {
  background-color: #1CA5D1 !important;
  border-radius: 6px !important;
  border: none !important;
  color: #fff !important;
  padding: 8px 14px !important;
  transition: all 0.2s ease-in-out;
}

button:hover {
  background-color: #F7901E !important;
  transform: scale(1.02);
}

/* ====== CARD AND CONTAINER ====== */
.layout-content,
.item_show__wrapper,
.card-section {
  background-color: #263F57 !important;
  color: #FCFDFD !important;
}
.admin-panel .card-section p,
.admin-panel .card-section span,
.admin-panel .card-section li,
.admin-panel .card-section a,
.admin-panel .card-section div,
.admin-panel .card-section strong,
.admin-panel .card-section em,
.form__wrapper.decidim_awesome-form .colors-help p,
.form__wrapper.decidim_awesome-form .colors-help span,
.form__wrapper.decidim_awesome-form .colors-help li,
.form__wrapper.decidim_awesome-form .colors-help strong,
.form__wrapper.decidim_awesome-form .colors-help em {
  color: #FCFDFD !important;
}

/* ====== LINKS ====== */
a {
  color: #1CA5D1 !important;
  text-decoration: none;
}

a:hover {
  color: #F7901E !important;
}

/* ====== MESSAGES ====== */
.flash__message {
  color: #FCFDFD !important;
}`;

				await decidimAwesomeAdminPage.editCssContent(cssContent);
			});

			await test.step('6. User: Clicks the "Update configuration" button to save changes.', async () => {
				await decidimAwesomeAdminPage.clickUpdateConfiguration();
			});

			await test.step('7. System: The system applies the new styles to the admin panel.', async () => {
				// verify configuration updated message
				await expect(decidimAwesomeAdminPage.configurationUpdatedMessage).toBeVisible();

				// Verify that all custom styles have been applied
				const allStylesApplied = await decidimAwesomeAdminPage.verifyAllCustomStylesApplied();
				expect(allStylesApplied).toBe(true);
			});
		});
		test.afterEach(async () => {
			await test.step('Cleanup: Remove the custom CSS box', async () => {
				// Delete the CSS box
				await decidimAwesomeAdminPage.clickDeleteCssBox();

				// Confirm deletion in modal
				await decidimAwesomeAdminPage.confirmDeleteCssBox();

				// Verify the CSS box was removed
				await expect(decidimAwesomeAdminPage.cssBoxRemovedMessage).toBeVisible();
				console.log('Custom CSS box successfully removed - Admin panel styles reset to default');
			});
		});
	});
});
