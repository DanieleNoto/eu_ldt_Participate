import { expect, test } from '@playwright/test';

import { ProcessTestDataGenerator } from '@fixtures/process-fixtures';
import { AdminHomePage } from '@pages/pages/admin/AdminHomePage';
import { ComponentsPage } from '@pages/pages/admin/processes/detail/components/ComponentsPage';
import { ManagePageComponentPage } from '@pages/pages/admin/processes/detail/components/ManagePageComponentPage';
import { NewPageComponentPage } from '@pages/pages/admin/processes/detail/components/NewPageComponentPage';
import { ProcessAdminPage } from '@pages/pages/admin/processes/ProcessAdminPage';
import { STORAGE_STATE } from '@utils/constants';

/**
 * Suite di test per l'aggiornamento della convocation page (componente Page) di un processo partecipativo
 *
 * Requisiti:
 * - Il City Administrator deve essere autenticato
 * - Deve esistere un processo partecipativo con permessi di modifica
 * - Deve esistere una convocation page (componente Page) associata al processo
 */
test.describe('[PAR-TRA001] – Update convocation page after process completion', () => {
	// Usa lo storage state admin per l'autenticazione
	test.use({ storageState: STORAGE_STATE.ADMIN });
	let adminHomePage: AdminHomePage;
	let componentsPage: ComponentsPage;
	let newPageComponentPage: NewPageComponentPage;
	let managePageComponentPage: ManagePageComponentPage;
	let processAdminPage: ProcessAdminPage;
	let validProcessData: any;

	// Dati di test - solo lingua inglese
	const testProcessData = {
		slug: 'test-process-convocation',
		title: 'Test Process for Convocation Page'
	};

	const convocationPageData = {
		name: 'Convocation Page',
		orderPosition: 1
	};

	const testContent = {
		title: 'Process Outcomes and Next Steps',
		body: 'This section contains the results, decisions and next steps of the participatory process.'
	};

	test.beforeEach(async ({ page }) => {
		// Navigazione diretta all'area admin e attesa del caricamento
		adminHomePage = new AdminHomePage(page);

		// Inizializzazione dei Page Objects
		processAdminPage = new ProcessAdminPage(page);
		componentsPage = new ComponentsPage(page);
		newPageComponentPage = new NewPageComponentPage(page);
		managePageComponentPage = new ManagePageComponentPage(page);

		// Genera dati di test validi
		validProcessData = ProcessTestDataGenerator.generateValidProcessData();

		// Override con dati specifici per questo test per garantire consistenza
		validProcessData.general.urlSlug = testProcessData.slug;
		validProcessData.general.title = testProcessData.title;
		await adminHomePage.navigateToAdminHomePage();
		// Setup iniziale: verifica/crea processo e convocation page
		await setupTestEnvironment();
	});

	/**
	 * Setup per garantire l'esistenza di un processo con convocation page
	 */
	async function setupTestEnvironment() {
		await test.step('Setup: Create/verify test process exists', async () => {
			await processAdminPage.createTestProcess(validProcessData);
			await processAdminPage.editFirstProcess();
		});

		await test.step('Setup: Create/verify convocation page component exists', async () => {
			// Naviga alla pagina Components del processo
			await componentsPage.sidebarProcessDetail.navigateToComponents();
			await componentsPage.waitForComponentsPageLoad();

			// Verifica se esiste già un componente Page
			const convocationPageExists = await componentsPage.findComponentByName(convocationPageData.name);

			if (!convocationPageExists) {
				// Se non esiste, crea la convocation page
				await createConvocationPage();
			}
		});
	}

	/**
	 * Crea una convocation page se non esiste
	 */
	async function createConvocationPage() {
		await test.step('Create convocation page component', async () => {
			// Aggiungi componente Page
			await componentsPage.addPagesComponent();

			// Verifica di essere nella pagina di creazione nuovo componente Page
			await newPageComponentPage.expectToBeOnNewPageComponentPage();

			// Compila il form di creazione
			await newPageComponentPage.fillNewPageComponentForm({
				name: convocationPageData.name,
				orderPosition: convocationPageData.orderPosition
			});

			// Salva il componente
			await newPageComponentPage.submitForm();

			// Verifica di essere tornati alla pagina Components
			await componentsPage.expectToBeOnComponentsPage();

			// Verifica che il componente sia stato creato
			await componentsPage.expectComponentExists(convocationPageData.name);
		});
	}

	test.describe('Main Flow - Update convocation page after process completion', () => {
		test('should successfully update convocation page content', async () => {
			await test.step('Navigate to convocation page management', async () => {
				// Naviga alla gestione del componente convocation page
				await componentsPage.sidebarProcessDetail.navigateToComponents();
				await componentsPage.manageComponent(convocationPageData.name);

				// Verifica di essere nella pagina di gestione
				await managePageComponentPage.verifyPageLoaded();
			});

			await test.step('Update content', async () => {
				// Aggiorna contenuti usando solo inglese
				await managePageComponentPage.fillBody(testContent.body);
			});

			await test.step('Save changes and verify success', async () => {
				// Salva le modifiche
				await managePageComponentPage.savePage();

				// Verifica che appaia la notifica di successo
				await managePageComponentPage.waitForSuccessFlashNotification('Page successfully saved.');
			});
		});
	});

	test.describe('Alternative Flow - abort update', () => {
		test('should discard changes when cancelling update', async () => {
			await test.step('Get original content and start editing', async () => {
				// Naviga alla gestione del componente
				await componentsPage.navigateToComponents(testProcessData.slug);
				await componentsPage.manageComponent(convocationPageData.name);
				await managePageComponentPage.verifyPageLoaded();

				// Inizia a modificare
				await managePageComponentPage.fillBody('Modified Body - Should be discarded');
			});

			await test.step('Cancel changes and verify discard', async () => {
				// Simula cancellazione navigando via senza salvare
				await componentsPage.navigateToComponents(testProcessData.slug);

				// Torna alla gestione del componente
				await componentsPage.manageComponent(convocationPageData.name);
				await managePageComponentPage.verifyPageLoaded();

				// Verifica che le modifiche non salvate siano state scartate
				const currentBody = await managePageComponentPage.getBody();
				expect(currentBody).not.toBe('Modified Body - Should be discarded');
			});
		});
	});
});
