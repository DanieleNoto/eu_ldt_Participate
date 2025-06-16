import { expect, test } from '@playwright/test';
import { ProcessTestDataGenerator } from '../../../../fixtures/process-fixtures';
import { ComponentsPage } from '../../../../pages/pages/admin/processes/detail/ComponentsPage';
import { ManagePageComponentPage } from '../../../../pages/pages/admin/processes/detail/ManagePageComponentPage';
import { NewPageComponentPage } from '../../../../pages/pages/admin/processes/detail/NewPageComponentPage';
import { ProcessAdminPage } from '../../../../pages/pages/admin/processes/ProcessAdminPage';
import { STORAGE_STATE } from '../../../../utils/constants';

/**
 * Suite di test per l'aggiornamento della convocation page (componente Page) di un processo partecipativo
 *
 * Requisiti:
 * - Il City Administrator deve essere autenticato
 * - Deve esistere un processo partecipativo con permessi di modifica
 * - Deve esistere una convocation page (componente Page) associata al processo
 */
test.describe('Update Convocation Page Tests', () => {
	// Usa lo storage state admin per l'autenticazione
	test.use({ storageState: STORAGE_STATE.ADMIN });

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
		await page.goto('/admin');
		await page.waitForLoadState('networkidle');

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

		// Setup iniziale: verifica/crea processo e convocation page
		await setupTestEnvironment();
	});

	/**
	 * Setup per garantire l'esistenza di un processo con convocation page
	 */
	async function setupTestEnvironment() {
		await test.step('Setup: Create/verify test process exists', async () => {
			// Usa la navigazione modulare del ProcessAdminPage
			await processAdminPage.navigateToProcesses();
			await processAdminPage.getPage().waitForLoadState('networkidle');

			// Verifica se siamo sulla pagina processi, con navigazione di fallback
			let isOnProcessesPage = await processAdminPage.isOnProcessesPage();

			if (!isOnProcessesPage) {
				// Prova navigazione diretta se la navigazione del componente è fallita
				await processAdminPage.getPage().goto('/admin/participatory_processes');
				await processAdminPage.getPage().waitForLoadState('networkidle');
				isOnProcessesPage = await processAdminPage.isOnProcessesPage();
			}

			expect(isOnProcessesPage).toBe(true);

			// Cerca se il processo di test esiste già
			const processExists = await processAdminPage
				.getPage()
				.locator(`a[href*="${testProcessData.slug}"]`)
				.first()
				.isVisible()
				.catch(() => false);

			if (!processExists) {
				// Se non esiste, crea un nuovo processo
				await createTestProcess();
			}
		});

		await test.step('Setup: Create/verify convocation page component exists', async () => {
			// Naviga alla pagina Components del processo
			await componentsPage.navigateToComponents(testProcessData.slug);
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
	 * Crea un processo di test se non esiste
	 */
	async function createTestProcess() {
		await test.step('Create test process', async () => {
			// Imposta timeout più lungo per questo test complesso
			test.setTimeout(180000); // 3 minuti

			// Naviga alla pagina di creazione nuovo processo
			await processAdminPage.navigateToNewProcess();

			// Verifica di essere sulla pagina nuovo processo
			const isOnNewProcessPage = await processAdminPage.isOnNewProcessPage();
			expect(isOnNewProcessPage).toBe(true);

			// Compila le informazioni generali del processo
			await processAdminPage.fillGeneralInfo(validProcessData.general);

			// Compila informazioni sulla durata
			await processAdminPage.fillDurationInfo(validProcessData.duration);

			// Aggiungi immagine se fornita
			if (validProcessData.image) {
				await processAdminPage.addImage(validProcessData.image);
			}

			// Compila informazioni sui metadati
			await processAdminPage.fillMetadataInfo(validProcessData.metadata);

			// Imposta visibilità pubblica
			await processAdminPage.setVisibilityToPublic();

			// Invia il processo
			await processAdminPage.submitProcess();

			// Verifica messaggio di successo
			await processAdminPage.expectSuccessMessage();

			// Verifica navigazione alla pagina steps del processo (indica creazione riuscita)
			await expect(processAdminPage.getPage()).toHaveURL(/\/admin\/participatory_processes\/.*\/steps/);
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

	test.describe('Scenario principale - Aggiornamento convocation page con successo', () => {
		test('should successfully update convocation page content', async () => {
			await test.step('Navigate to convocation page management', async () => {
				// Naviga alla gestione del componente convocation page
				await componentsPage.navigateToComponents(testProcessData.slug);
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

			// await test.step('Verify persistence after page reload', async () => {
			// 	// Ricarica la pagina per verificare persistenza
			// 	await managePageComponentPage.reloadPage();

			// 	// Verifica che i contenuti siano ancora presenti
			// 	await managePageComponentPage.expectTitle(testContent.title);
			// });
		});
	});

	test.describe('Scenario alternativo - Cancellazione aggiornamento', () => {
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

	// test.describe.skip('Scenario alternativo - Validazione campi con errore', () => {
	// 	test('should show validation errors for invalid fields', async () => {
	// 		await test.step('Navigate to convocation page management', async () => {
	// 			await componentsPage.navigateToComponents(testProcessData.slug);
	// 			await componentsPage.manageComponent(convocationPageData.name);
	// 			await managePageComponentPage.verifyPageLoaded();
	// 		});

	// 		await test.step('Clear required fields and attempt save', async () => {
	// 			// Svuota campi obbligatori
	// 			await managePageComponentPage.fillTitle('');

	// 			// Prova a salvare con campi vuoti
	// 			await managePageComponentPage.clickUpdateButton();

	// 			// Verifica che la pagina non sia stata salvata (resta sul form)
	// 			await managePageComponentPage.verifyPageLoaded();

	// 			// Verifica presenza di messaggi di errore
	// 			const hasErrors = await managePageComponentPage.hasErrorMessages();

	// 			// Se il form non mostra errori specifici, verifica almeno che non siamo usciti dalla pagina
	// 			const isStillOnEditPage = await managePageComponentPage.isOnManagePageUrl();
	// 			expect(isStillOnEditPage).toBeTruthy();
	// 		});

	// 		await test.step('Fix validation errors and save successfully', async () => {
	// 			// Correggi i campi
	// 			await managePageComponentPage.fillTitle('Corrected Title');
	// 			await managePageComponentPage.fillBody('Corrected body content');

	// 			// Salva correttamente
	// 			await managePageComponentPage.savePage();

	// 			// Verifica che appaia la notifica di successo
	// 			await managePageComponentPage.waitForSuccessFlashNotification('Page successfully saved.');

	// 			// Verifica successo
	// 			await managePageComponentPage.waitForLoadState('networkidle');
	// 		});
	// 	});
	// });

	// test.describe.skip('Scenario alternativo - Errore di salvataggio', () => {
	// 	test('should handle save errors gracefully', async () => {
	// 		await test.step('Navigate to convocation page management', async () => {
	// 			await componentsPage.navigateToComponents(testProcessData.slug);
	// 			await componentsPage.manageComponent(convocationPageData.name);
	// 			await managePageComponentPage.verifyPageLoaded();
	// 		});

	// 		await test.step('Simulate network error during save', async () => {
	// 			// Modifica contenuto
	// 			await managePageComponentPage.fillTitle('Title that might fail to save');

	// 			// Simula errore di rete intercettando la richiesta di salvataggio
	// 			await managePageComponentPage.simulateNetworkError('**/static_pages/**');

	// 			// Prova a salvare
	// 			await managePageComponentPage.clickUpdateButton();

	// 			// Verifica gestione dell'errore
	// 			await managePageComponentPage.waitForTimeout(2000);

	// 			// Verifica che siamo ancora sulla pagina di modifica
	// 			const isStillOnEditPage = await managePageComponentPage.isOnManagePageUrl();
	// 			expect(isStillOnEditPage).toBeTruthy();
	// 		});

	// 		await test.step('Retry save after error', async () => {
	// 			// Rimuovi l'intercettazione dell'errore
	// 			await managePageComponentPage.clearNetworkInterception('**/static_pages/**');

	// 			// Riprova a salvare
	// 			await managePageComponentPage.savePage();

	// 			// Verifica che appaia la notifica di successo
	// 			await managePageComponentPage.waitForSuccessFlashNotification('Page successfully saved.');

	// 			// Verifica successo
	// 			await managePageComponentPage.waitForLoadState('networkidle');
	// 		});
	// 	});
	// });

	// test.afterEach(async ({ page }) => {
	// 	// Cleanup se necessario
	// 	// In questo caso manteniamo il processo e la convocation page per test successivi
	// });
});
