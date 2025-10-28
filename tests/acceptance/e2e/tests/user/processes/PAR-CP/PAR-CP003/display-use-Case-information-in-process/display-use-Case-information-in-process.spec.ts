import { test, expect } from '@playwright/test';
import { DecidimKeycloakAuthHelper } from '../../../../../../utils/decidim-keycloak-auth';
import { TEST_SELECTORS } from '../../../../../../utils/constants';

/**
 * Test suite When a process is linked to a Use Case, the system retrieves and displays information from the EU LDT Use Cases & Scenarios Tool
 * within the Process and integrates with the capabilities of EU LDT Play & Visualise for the visualisation of static images. This allows citizens to view scenario details directly.
 *
 * User Story: As a Citizen, I want to view Use Case information within a Process so that I can better understand the context and implications of the proposal.
 *
 * Requirements: PAR R8, PAR R20, PAR R6
 *
 * Prerequisites:
 * - The process is created and linked to a Use Case from the EU LDT Use Cases & Scenarios Tool.
 * - The EU LDT Use Cases & Scenarios Tool is accessible and integrated with the platform.
 * - The citizen has access to view process on the platform.
*/

/** SPDX-License-Identifier: EUPL-1.2
* Copyright (c) 2025, European Commission. Licensed under the EUPL-1.2
* Authors:
* Denise Scarcelli
*/

test.describe('[PAR-CP003] Display Use Case information in process', () => {
    let decidimAuth: DecidimKeycloakAuthHelper;

    test.beforeEach(async ({ page }) => {
        const userEmail = process.env.TEST_USER_EMAIL;
        const userPassword = process.env.TEST_USER_PASSWORD;
        if (!userEmail || !userPassword) {
            throw new Error('TEST_USER_EMAIL or TEST_USER_PASSWORD not set in .env file');
        }
        decidimAuth = new DecidimKeycloakAuthHelper();
        await decidimAuth.injectSessionIntoPage(page, userEmail, userPassword);
    });

    test.afterEach(async () => {
        await decidimAuth.dispose();
    });
    test.describe('Main Flow', () => {
        test('User views Use Case information embedded in Process page', async ({ page }) => {
            await test.step('1. User: Navigates to the process section and selects a specific process that is linked to a Use Case.', async () => {
                await page.goto('/processes');
                await page.waitForLoadState('networkidle');
                const firstProcess = page.locator(TEST_SELECTORS.PROCESS.PROCESS_GRID).first();
                await expect(firstProcess).toBeVisible();
                const firstProcessTitleLocator = page.locator(TEST_SELECTORS.PROCESS.PROCESS_GRID + ' .card__grid-text h3').first();
                const selectedProcessTitle = (await firstProcessTitleLocator.innerText()).trim();
                (page as any).__selectedProcessTitle = selectedProcessTitle;
                await firstProcess.click();
                await page.waitForLoadState('networkidle');
            });

            await test.step('2. System: Displays the Process in a clear and organized format.', async () => {
                const heroTitleLocator = page.locator('[data-process-hero] h1.h1').first();
                const altHeroTitleLocator = page.locator('main h1.h1').first();
                let heroTitle = '';
                if (await heroTitleLocator.count() > 0) {
                    await expect(heroTitleLocator).toBeVisible();
                    heroTitle = (await heroTitleLocator.innerText()).trim();
            } else {
                    await expect(altHeroTitleLocator).toBeVisible();
                    heroTitle = (await altHeroTitleLocator.innerText()).trim();
            }
                const savedProcessTitle = (page as any).__selectedProcessTitle as string | undefined;
                if (savedProcessTitle) {
                    await expect(heroTitle).toContain(savedProcessTitle);
                }
            });

            await test.step('3. User: The user selects "LDT Use Case Scenarios"', async () => {
                const useCase = page.getByRole('link', { name: 'LDT Use Case Scenarios', exact: true }).first();
                await useCase.click();
                await page.waitForLoadState('networkidle');
                await expect(page).toHaveURL(/\/use_case_scenarios/);            
            });
          


            await test.step('4. System: Verify scenarios are displayed', async () => {
                const scenarioList = page.locator(TEST_SELECTORS.PROCESS.SCENARIO_LIST);
                const coutScenarios = await scenarioList.count();
                expect(coutScenarios).toBeGreaterThan(0);
            });

            await test.step('5. User: The user selects a specific scenario', async () => {
                const firstScenario = page.locator(TEST_SELECTORS.PROCESS.FIRST_SCENARIO);
                const firstScenarioTitleLocator = page
                    .locator(TEST_SELECTORS.PROCESS.FIRST_SCENARIO + ' .card__list-title');
                const selectedScenarioTitle = (await firstScenarioTitleLocator.innerText()).trim();
                (page as any).__selectedScenarioTitle = selectedScenarioTitle;
                const metadataLocator = page.locator(TEST_SELECTORS.PROCESS.FIRST_SCENARIO + ' .card__list-metadata > div').first();
                let metadataText = '';
                if (await metadataLocator.count() > 0) {
                    metadataText = (await metadataLocator.innerText()).trim();
                        metadataText = metadataText
                          .replace(/\s+/g, ' ')
                          .replace(/\u2026/g, '')
                          .replace(/\.{3,}/g, '')
                          .replace(/[\u200B-\u200D\uFEFF]/g, '')
                          .trim();
                    (page as any).__selectedScenarioMetadata = metadataText;
                }                
                await firstScenario.click();
                await page.waitForLoadState('networkidle');
            });

            await test.step('6. System: Embed Use Case information exposed by Use Case & Scenario manager inside the Process page', async () => {
                const useCaseContent = page.locator(TEST_SELECTORS.PROCESS.USE_CASE_CONTENT);
                const countContent = await useCaseContent.count();
                expect(countContent).toBeGreaterThan(0);
            });

            await test.step('7. System: Display a small, non-intrusive label ("Created by AI" disclaimer) adjacent to the content.', async () => {
                const aiLabel = page.locator(TEST_SELECTORS.PROCESS.AI_LABEL);
                await expect(aiLabel).toBeVisible();
                await expect(aiLabel).toContainText('AI');
            });

            await test.step('8. User: Reviews the Process content along with the Use Case information.', async () => {
                const heading = page.locator(TEST_SELECTORS.PROCESS.SCENARIO_HEADING);
                await expect(heading).toBeVisible();
                const selectedScenarioTitle = (page as any).__selectedScenarioTitle as string;
                await expect(heading).toContainText(selectedScenarioTitle);
                const savedMetadataID = (page as any).__selectedScenarioMetadata as string;
                if (!savedMetadataID) throw new Error('No saved metadata found from Step 5');
                const useCaseFirstContent = page.locator(TEST_SELECTORS.PROCESS.USE_CASE_CONTENT).first();
                const metaTextLocator = useCaseFirstContent.locator('.definition-data__text');
                const displayedID = (await metaTextLocator.innerText()).trim();
                expect(displayedID).toContain(savedMetadataID);
            });

            await test.step('9. User: Access additional information or interactive elements related to the Use Case (e.g., expanded visual data or scenario metrics)', async () => {
                const expIdTitle = page.locator(TEST_SELECTORS.PROCESS.EXPERIMENT_ID_TITLE);
                await expect(expIdTitle).toHaveText('Experiment ID');

                const expIdText = page.locator(TEST_SELECTORS.PROCESS.EXPERIMENT_ID_TEXT);
                await expect(expIdText).toBeVisible();
                await expect(expIdText).not.toBeEmpty();

                const iframeContainer = page.locator(TEST_SELECTORS.PROCESS.METRICS_IFRAME_CONTAINER);
                await expect(iframeContainer).toBeVisible();

                // const iframeElement = page.locator(TEST_SELECTORS.PROCESS.METRICS_IFRAME);
                // await expect(iframeElement).toBeVisible();

                // const iframeLocator = page.frameLocator(TEST_SELECTORS.PROCESS.METRICS_IFRAME);
                // try {
                //     await iframeLocator.locator('body').waitFor({ state: 'visible' });
                // } catch (e) {
                //     const iframeSrc = await iframeElement.getAttribute('src');
                //     console.log('Iframe src (fallback):', iframeSrc);
                // }
            });

            await test.step('Result: Log success', async () => {
                console.log('Use Case information successfully displayed within the Process page');
            });

        });
    });
});
