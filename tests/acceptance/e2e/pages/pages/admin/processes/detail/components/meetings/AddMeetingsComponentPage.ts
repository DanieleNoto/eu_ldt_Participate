import { Page, Locator, expect } from '@playwright/test';
import { FormMeetingPage } from '../../meetings/FormMeetingPage';

export class AddMeetingsComponentPage extends FormMeetingPage {

    private readonly nameInputEn: Locator;
    private readonly announcementEditorEn: Locator;
    private readonly announcementContentEditableEn: Locator;
    private readonly saveButton: Locator;
    private readonly updateComponentButton: Locator;    

    constructor(page: Page) {
        super(page);
        this.nameInputEn = page.locator('input#component_name_en');
        this.announcementEditorEn = page.locator('#component_settings_announcement_en .editor-input');
        this.announcementContentEditableEn = page.locator('#component_settings_announcement_en [contenteditable="true"]');
        this.saveButton = page.locator('form#new_component_ button[type="submit"]');
        this.updateComponentButton = page.getByRole('button', { name: 'Update' });
    }

    async fillNameEn(name: string) {
        await this.nameInputEn.fill(name);
    }

    async fillAnnouncementEn(text: string) {
        await this.announcementContentEditableEn.fill(text);
    }

    async submitForm() {
        await this.saveButton.click();
        await this.page.waitForLoadState('networkidle');
    }

    async updateComponent() {
    await this.updateComponentButton.click();
    await this.page.waitForLoadState('networkidle');
}


    async expectNameVisible() {
        await expect(this.nameInputEn).toBeVisible();
    }

    async expectAnnouncementVisible() {
        await expect(this.announcementEditorEn).toBeVisible();
    }

    getPage(): Page {
        return this.page;
    }
}