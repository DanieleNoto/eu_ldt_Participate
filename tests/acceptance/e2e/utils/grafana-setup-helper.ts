import { Page, expect } from '@playwright/test';
import { GRAFANA_URLS } from './constants';

/**
 * Sets up and refreshes the Decidim PostgreSQL data source in Grafana.
 * Navigates to the data source settings, triggers a "Save and Test" action,
 * and verifies that the database connection is successfully established.
 */
export async function setupGrafanaDataSource(page: Page): Promise<void> {
    await page.goto(`${GRAFANA_URLS.BASE}/dashboards`);
    await page.waitForLoadState('networkidle');  
    await page.getByRole('link', { name: 'Connections' }).click();
    await page.getByRole('button', { name: 'View configured data sources' }).click();
    await page.getByRole('link', { name: 'Decidim PostgreSQL' }).click();
    await page.getByTestId('data-testid Data source settings page Save and Test button').click();
    await expect(page.getByText('Database Connection OK')).toBeVisible();
    await page.getByRole('link', { name: 'Dashboards' }).click();
}
