Ecco le best practices per strutturare le pagine usando il Pattern Object Model (POM) in Playwright:

## 1. Struttura Gerarchica delle Pagine

### Approccio Consigliato

```
pages/
├── base/
│   ├── BasePage.ts              # Classe base con funzionalità comuni
│   ├── AuthenticatedPage.ts     # Per pagine che richiedono autenticazione
│   └── PublicPage.ts           # Per pagine pubbliche
├── components/
│   ├── common/
│   │   ├── HeaderComponent.ts
│   │   ├── FooterComponent.ts
│   │   └── NavigationComponent.ts
│   ├── forms/
│   │   ├── LoginFormComponent.ts
│   │   └── RegistrationFormComponent.ts
│   └── admin/
│       ├── AdminHeaderComponent.ts
│       └── AdminSidebarComponent.ts
└── pages/
    ├── HomePage.ts
    ├── LoginPage.ts
    ├── DashboardPage.ts
    └── admin/
        ├── AdminDashboardPage.ts
        └── OrganizationEditPage.ts
```

## 2. Principi di Organizzazione

### Una Pagina per Path/Funzionalità

- **✅ Sì**: Crea una classe per ogni pagina/rotta principale
- **✅ Composizione**: Usa componenti per parti riutilizzabili
- **❌ No**: Non creare una classe per ogni singola variazione di URL

### Esempio di Struttura

````typescript
import { Page } from '@playwright/test';

export abstract class BasePage {
    constructor(protected page: Page) {}
    
    async navigateTo(url: string) {
        await this.page.goto(url);
    }
    
    async waitForPageLoad() {
        await this.page.waitForLoadState('networkidle');
    }
}
````

````typescript
import { BasePage } from './base/BasePage';
import { HeaderComponent } from '../components/common/HeaderComponent';
import { AdminHeaderComponent } from '../components/admin/AdminHeaderComponent';

export class DashboardPage extends BasePage {
    private header: HeaderComponent;
    private adminHeader: AdminHeaderComponent;
    
    constructor(page: Page) {
        super(page);
        this.header = new HeaderComponent(page);
        this.adminHeader = new AdminHeaderComponent(page);
    }
    
    async navigateToDashboard() {
        await this.navigateTo('/dashboard');
        await this.waitForPageLoad();
    }
    
    // Metodi specifici della dashboard
    async getDashboardTitle(): Promise<string> {
        return await this.page.locator('h1').textContent() || '';
    }
}
````

## 3. Best Practices per i Componenti

### Componenti Riutilizzabili

````typescript
import { Page } from '@playwright/test';

export class HeaderComponent {
    constructor(private page: Page) {}
    
    private get logo() {
        return this.page.locator('.header__logo');
    }
    
    private get navigationMenu() {
        return this.page.locator('.header__nav');
    }
    
    async clickLogo() {
        await this.logo.click();
    }
    
    async isNavigationVisible(): Promise<boolean> {
        return await this.navigationMenu.isVisible();
    }
}
````

## 4. Gestione dell'Ereditarietà

### Pagine con Autenticazione

````typescript
import { BasePage } from './BasePage';
import { HeaderComponent } from '../../components/common/HeaderComponent';

export class AuthenticatedPage extends BasePage {
    protected header: HeaderComponent;
    
    constructor(page: Page) {
        super(page);
        this.header = new HeaderComponent(page);
    }
    
    async ensureAuthenticated() {
        const isLoggedIn = await this.page.locator('.user-menu').isVisible();
        if (!isLoggedIn) {
            throw new Error('User must be authenticated to access this page');
        }
    }
}
````

## 5. Organizzazione per Moduli/Funzionalità

### Struttura Modulare

```
pages/
├── auth/
│   ├── LoginPage.ts
│   ├── RegisterPage.ts
│   └── ForgotPasswordPage.ts
├── admin/
│   ├── AdminDashboardPage.ts
│   ├── UserManagementPage.ts
│   └── OrganizationPage.ts
├── user/
│   ├── ProfilePage.ts
│   └── SettingsPage.ts
└── public/
    ├── HomePage.ts
    └── AboutPage.ts
```

## 6. Esempio di Utilizzo nei Test

````typescript
import { test, expect } from '@playwright/test';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';

test.describe('Admin Dashboard', () => {
    let adminPage: AdminDashboardPage;
    
    test.beforeEach(async ({ page }) => {
        adminPage = new AdminDashboardPage(page);
        await adminPage.navigateToAdminDashboard();
    });
    
    test('should display admin header', async () => {
        await expect(adminPage.adminHeader.isAdminBarVisible()).resolves.toBe(true);
    });
});
````

## 7. Vantaggi di questa Struttura

- **Riusabilità**: Componenti utilizzabili in più pagine
- **Manutenibilità**: Modifiche isolate per funzionalità specifiche
- **Scalabilità**: Facile aggiungere nuove pagine/componenti
- **Separazione delle responsabilità**: Ogni classe ha uno scopo specifico
- **DRY Principle**: Evita duplicazione di codice

Questa struttura ti permette di mantenere il codice organizzato, testabile e facilmente manutenibile man mano che il progetto cresce.
