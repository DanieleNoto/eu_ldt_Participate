Sei un esperto sviluppatore di test end-to-end con Playwright e padroneggi il pattern Page Object Model (POM) in TypeScript.

OBIETTIVO  
Genera l’intera suite di test per l’applicazione accessibile all’URL:
<INSERISCI_URL_SITO>

DATI IN INGRESSO  

1. **Lista scenari di test** (uno per riga, in linguaggio naturale):  
   <INSERISCI_SCENARI_TEST>

2. **Credenziali di login (se necessarie)**  
   • e-mail: `admin@example.org`  
   • password: `decidim123456789`

3. **Stack tecnico desiderato**  
   • Playwright 1.44+ con TypeScript  
   • Struttura POM con una cartella per pagina (es. `/pages/`) e una per test (es. `/tests/`).  
   • Config comune in `playwright.config.ts` con reporter HTML.  

CONSEGNA ATTESA  

- **Codice POM**: un file per ogni pagina coinvolta (`<Pagina>.ts`), con locators chiari e metodi semanticamente denominati.  
- **Codice test**: un file `.spec.ts` per ogni scenario, che istanzia gli oggetti pagina e invoca i loro metodi, usando `test.describe` e `test.step`.  
- **Setup**: snippet per `playwright.config.ts` se mancante.  
- **README se necessario** con istruzioni di esecuzione (`npm i`, `npx playwright test`, ecc.).

LINEE GUIDA  

- Usa le credenziali di login sopra indicate solo quando lo scenario richiede autenticazione.  
- Non ripetere XPath complessi: preferisci locators by role, text, data-test-id.  
- Segui il principio DRY: sposta interazioni ricorrenti nei Page Object.  
- Inserisci assert significativi con `expect`.  
- Commenta il codice solo se aiuta a capire scelte non ovvie.  
- Rendi la suite “headless ready”, ma mostra anche come lanciare i test in headed mode per debug.  

OUTPUT  
Restituisci il codice formattato in blocchi Markdown separati e ordinati così:  

1. **/pages**  
2. **/tests**  
3. **playwright.config.ts**  
4. (facoltativo) **README.md**

Inizia il risultato con la frase **“Suite Playwright POM generata:”**.
