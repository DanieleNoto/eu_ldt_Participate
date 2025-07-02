import { HomePage } from '@pages/pages/public/HomePage';
import { ProcessDetailPage } from '@pages/pages/public/processes/ProcessDetailPage';
import { ProcessesOverviewPage } from '@pages/pages/public/processes/ProcessesOverviewPage';
import test, { expect } from '@playwright/test';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Test suite for view and explore all the available processes in the system, providing an overview of ongoing, upcoming, and past processes.
 *
 * User Story: As a Citizen, I want to visualize all the processes available in the system so that I can understand which processes are ongoing, upcoming, or completed and decide which ones I am interested in participating in.
 *
 * Requirements: PAR R8
 *
 * Prerequisites:
 * - The citizen has an active account on the platform and is logged in (optional for public processes).
 */
test.describe('[PAR-CP001] – Visualize all processes in the system', () => {
	test.use({ storageState: STORAGE_STATE.USER });
	let processesOverviewPage: ProcessesOverviewPage;
	let processDetailPage: ProcessDetailPage;
	let homePage: HomePage;

	test.beforeEach(async ({ page }) => {
		homePage = new HomePage(page);
		processesOverviewPage = new ProcessesOverviewPage(page);
		processDetailPage = new ProcessDetailPage(page);

		await homePage.navigateToHomePage();
	});

	test.describe('Main Flow', () => {
		test('should allows citizens to visualize all processes in the system', async () => {
			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate to processes section
				await homePage.goToProcessesFromHomeMenu();
				await processesOverviewPage.getPage().waitForLoadState('networkidle');
			});
			await test.step('2. System: Displays a list of all processes, categorized as ongoing, upcoming, or completed. The list includes basic information, such as title, short description, and status.', async () => {
				await processesOverviewPage.expectToBeOnProcessesOverviewPage();

				// Verifica che ci siano processi visualizzati
				const count = await processesOverviewPage.getProcessesCount();
				expect(count).toBeGreaterThan(0);

				// Ottiene i titoli dei processi per debug
				const titles = await processesOverviewPage.getAllProcessTitles();
				console.log('Processi disponibili:', titles);
			});
			await test.step('3. System: Provides filtering options for citizens to easily find processes of interest.', async () => {
				await processesOverviewPage.expectProcessesFilterToBeVisible();
			});
			await test.step('4. System: Allows the citizen to click on a specific process for more details', async () => {
				// Seleziona il primo processo disponibile
				await processesOverviewPage.navigateToProcessByIndex(0);

				// Verifica di essere nella pagina di dettaglio del processo
				await expect(processDetailPage.getPage()).toHaveURL(/\/processes\/.*$/);
			});
			await test.step('Result. The citizen has an overview of all available processes and can easily navigate to more detailed information about a specific process.', async () => {
				// Verifica che la pagina di dettaglio mostri informazioni sul processo
				await processDetailPage.expectToBeOnProcessDetailPage();
			});
		});
	});

	test.describe('Alternative Flow', () => {
		test('should allows citizens to filter processes in the "Processes" section', async () => {
			await test.step('1. User: navigates to the "Processes" section', async () => {
				// Navigate to processes section
				await homePage.goToProcessesFromHomeMenu();
				await processesOverviewPage.getPage().waitForLoadState('networkidle');
			});
			await test.step('2. System: Displays a list of all processes, categorized as ongoing, upcoming, or completed. The list includes basic information, such as title, short description, and status.', async () => {
				await processesOverviewPage.expectToBeOnProcessesOverviewPage();
			});
			await test.step('3. System: Provides filtering options for citizens to easily find processes of interest.', async () => {
				await processesOverviewPage.expectProcessesFilterToBeVisible();
			});
			await test.step('3.1 User: Applies filters to narrow down the list of processes.', async () => {
				// Registra il numero di processi prima del filtro
				const countBefore = await processesOverviewPage.getProcessesCount();
				console.log('Numero di processi prima del filtro:', countBefore);

				// Applica un filtro per data (ad esempio, processi attivi)
				await processesOverviewPage.filterByDate('active');

				// Attendi che i risultati vengano aggiornati
				await processesOverviewPage.getPage().waitForLoadState('networkidle');
			});
			await test.step('3.2 System: Displays an updated list of processes based on the filters.', async () => {
				// Verifica che il filtro sia stato applicato
				const currentFilter = await processesOverviewPage.getSelectedDateFilter();
				expect(currentFilter).toBe('active');

				// Verifica se ci sono processi mostrati dopo il filtro
				const countAfter = await processesOverviewPage.getProcessesCount();
				console.log('Numero di processi dopo il filtro:', countAfter);

				// Ottiene i titoli dei processi filtrati
				if (countAfter > 0) {
					const filteredTitles = await processesOverviewPage.getAllProcessTitles();
					console.log('Processi attivi:', filteredTitles);
				}
			});
			await test.step('Result. The citizen can easily find relevant processes based on their preferences.', async () => {
				// Resetta i filtri
				await processesOverviewPage.resetAllFilters();

				// Verifica che il filtro sia stato resettato
				const currentFilter = await processesOverviewPage.getSelectedDateFilter();
				expect(currentFilter).toBe('all');

				// Verifica che ci siano di nuovo tutti i processi
				const countAfterReset = await processesOverviewPage.getProcessesCount();
				console.log('Numero di processi dopo il reset dei filtri:', countAfterReset);
			});
		});
	});
});
