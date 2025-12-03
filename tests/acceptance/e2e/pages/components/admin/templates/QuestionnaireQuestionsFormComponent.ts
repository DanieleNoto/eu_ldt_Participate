/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denis Vasilev Dimchev
 */

import { Page } from '@playwright/test';

/**
 * Component for managing questionnaire questions within a template.
 * Handles adding, editing, and organizing questions in the questionnaire editor.
 */
export class QuestionnaireQuestionsFormComponent {
	constructor(private page: Page) {}

	// Main header selectors
	private get headerTitle() {
		return this.page.locator('.item_show__header-title');
	}

	private get addQuestionButton() {
		return this.page.locator('.add-question');
	}

	private get addSeparatorButton() {
		return this.page.locator('.add-separator');
	}

	private get addTitleAndDescriptionButton() {
		return this.page.locator('.add-title-and-description');
	}

	// Form controls
	private get collapseAllButton() {
		return this.page.locator('.collapse-all');
	}

	private get expandAllButton() {
		return this.page.locator('.expand-all');
	}

	private get saveButton() {
		return this.page.locator('.item__edit-sticky button[type="submit"]');
	}

	// Question list
	private get questionsList() {
		return this.page.locator('.questionnaire-questions-list');
	}

	private get allQuestions() {
		return this.page.locator('.questionnaire-question');
	}

	// Individual question controls
	private questionSelector(index: number) {
		return this.allQuestions.nth(index);
	}

	private questionCollapseButton(index: number) {
		return this.questionSelector(index).locator('.question--collapse');
	}

	private questionMoveUpButton(index: number) {
		return this.questionSelector(index).locator('.move-up-question');
	}

	private questionMoveDownButton(index: number) {
		return this.questionSelector(index).locator('.move-down-question');
	}

	private questionRemoveButton(index: number) {
		return this.questionSelector(index).locator('.remove-question');
	}

	// Question form fields
	private questionBodyField(index: number, language: string = 'en') {
		return this.questionSelector(index).locator(`input[name*="[body_${language}]"]`);
	}

	private questionDescriptionField(index: number, language: string = 'en') {
		return this.questionSelector(index).locator(`input[name*="[description_${language}]"]`);
	}

	private questionMandatoryCheckbox(index: number) {
		return this.questionSelector(index).locator('input[name*="[mandatory]"][type="checkbox"]');
	}

	private questionCharacterLimitField(index: number) {
		return this.questionSelector(index).locator('input[name*="[max_characters]"]');
	}

	private questionTypeSelect(index: number) {
		return this.questionSelector(index).locator('select[name*="[question_type]"]');
	}

	// Language tabs
	private languageTab(questionIndex: number, language: string) {
		const languageMap = { en: 'English', ca: 'Català', es: 'Castellano' };
		return this.questionSelector(questionIndex)
			.locator('.tabs--lang')
			.locator('a', { hasText: languageMap[language as keyof typeof languageMap] });
	}

	// Answer options
	private addAnswerOptionButton(questionIndex: number) {
		return this.questionSelector(questionIndex).locator('.add-answer-option');
	}

	private answerOptions(questionIndex: number) {
		return this.questionSelector(questionIndex).locator('.questionnaire-question-answer-option');
	}

	private answerOptionBodyField(questionIndex: number, optionIndex: number, language: string = 'en') {
		return this.answerOptions(questionIndex).nth(optionIndex).locator(`input[name*="[body_${language}]"]`);
	}

	private removeAnswerOptionButton(questionIndex: number, optionIndex: number) {
		return this.answerOptions(questionIndex).nth(optionIndex).locator('.remove-answer-option');
	}

	// Matrix rows
	private addMatrixRowButton(questionIndex: number) {
		return this.questionSelector(questionIndex).locator('.add-matrix-row');
	}

	private matrixRows(questionIndex: number) {
		return this.questionSelector(questionIndex).locator('.questionnaire-question-matrix-row');
	}

	// Display conditions
	private addDisplayConditionButton(questionIndex: number) {
		return this.questionSelector(questionIndex).locator('.add-display-condition');
	}

	// Main actions
	async getPageTitle(): Promise<string> {
		return (await this.headerTitle.textContent()) || '';
	}

	async isPageLoaded(): Promise<boolean> {
		await this.page.waitForSelector('.questionnaire-questions');
		await this.page.waitForSelector('.item__edit-form');
		return (await this.headerTitle.isVisible()) && (await this.addQuestionButton.isVisible());
	}

	// Question management
	async addQuestion(): Promise<void> {
		await this.addQuestionButton.click();
	}

	async addSeparator(): Promise<void> {
		await this.addSeparatorButton.click();
	}

	async addTitleAndDescription(): Promise<void> {
		await this.addTitleAndDescriptionButton.click();
	}

	async collapseAllQuestions(): Promise<void> {
		await this.collapseAllButton.click();
	}

	async expandAllQuestions(): Promise<void> {
		await this.expandAllButton.click();
	}

	async getQuestionsCount(): Promise<number> {
		return await this.allQuestions.count();
	}

	// Individual question actions
	async collapseQuestion(index: number): Promise<void> {
		await this.questionCollapseButton(index).click();
	}

	async expandQuestion(index: number): Promise<void> {
		await this.questionCollapseButton(index).click();
	}

	async moveQuestionUp(index: number): Promise<void> {
		await this.questionMoveUpButton(index).click();
	}

	async moveQuestionDown(index: number): Promise<void> {
		await this.questionMoveDownButton(index).click();
	}

	async removeQuestion(index: number): Promise<void> {
		await this.questionRemoveButton(index).click();
	}

	// Question form filling
	async fillQuestionBody(index: number, text: string, language: string = 'en'): Promise<void> {
		await this.switchToLanguageTab(index, language);
		await this.questionBodyField(index, language).fill(text);
	}

	async fillQuestionDescription(index: number, text: string, language: string = 'en'): Promise<void> {
		await this.switchToLanguageTab(index, language);
		await this.questionDescriptionField(index, language).fill(text);
	}

	async setQuestionMandatory(index: number, mandatory: boolean = true): Promise<void> {
		const checkbox = this.questionMandatoryCheckbox(index);
		if (mandatory) {
			await checkbox.check();
		} else {
			await checkbox.uncheck();
		}
	}

	async setCharacterLimit(index: number, limit: number): Promise<void> {
		await this.questionCharacterLimitField(index).fill(limit.toString());
	}

	async setQuestionType(index: number, type: string): Promise<void> {
		await this.questionTypeSelect(index).selectOption(type);
	}

	async switchToLanguageTab(index: number, language: string): Promise<void> {
		await this.languageTab(index, language).click();
	}

	// Answer options management
	async addAnswerOption(questionIndex: number): Promise<void> {
		await this.addAnswerOptionButton(questionIndex).click();
	}

	async getAnswerOptionsCount(questionIndex: number): Promise<number> {
		return await this.answerOptions(questionIndex).count();
	}

	async fillAnswerOption(
		questionIndex: number,
		optionIndex: number,
		text: string,
		language: string = 'en'
	): Promise<void> {
		await this.answerOptionBodyField(questionIndex, optionIndex, language).fill(text);
	}

	async removeAnswerOption(questionIndex: number, optionIndex: number): Promise<void> {
		await this.removeAnswerOptionButton(questionIndex, optionIndex).click();
	}

	// Matrix management
	async addMatrixRow(questionIndex: number): Promise<void> {
		await this.addMatrixRowButton(questionIndex).click();
	}

	async getMatrixRowsCount(questionIndex: number): Promise<number> {
		return await this.matrixRows(questionIndex).count();
	}

	// Complete question creation workflow
	async createSimpleQuestion(questionData: {
		body: string;
		type?: string;
		mandatory?: boolean;
		characterLimit?: number;
		language?: string;
	}): Promise<void> {
		const currentCount = await this.getQuestionsCount();
		await this.addQuestion();

		const questionIndex = currentCount;
		const language = questionData.language || 'en';

		await this.fillQuestionBody(questionIndex, questionData.body, language);

		if (questionData.type) {
			await this.setQuestionType(questionIndex, questionData.type);
		}

		if (questionData.mandatory !== undefined) {
			await this.setQuestionMandatory(questionIndex, questionData.mandatory);
		}

		if (questionData.characterLimit) {
			await this.setCharacterLimit(questionIndex, questionData.characterLimit);
		}
	}

	async createQuestionWithOptions(questionData: {
		body: string;
		type: 'single_option' | 'multiple_option';
		options: string[];
		mandatory?: boolean;
		language?: string;
	}): Promise<void> {
		const currentCount = await this.getQuestionsCount();
		await this.addQuestion();

		const questionIndex = currentCount;
		const language = questionData.language || 'en';

		await this.fillQuestionBody(questionIndex, questionData.body, language);
		await this.setQuestionType(questionIndex, questionData.type);

		if (questionData.mandatory !== undefined) {
			await this.setQuestionMandatory(questionIndex, questionData.mandatory);
		}

		// Add answer options
		for (let i = 0; i < questionData.options.length; i++) {
			await this.addAnswerOption(questionIndex);
			await this.fillAnswerOption(questionIndex, i, questionData.options[i], language);
		}
	}

	// Form validation and saving
	async isFormValid(): Promise<boolean> {
		const questionsCount = await this.getQuestionsCount();
		return questionsCount > 0;
	}

	async saveQuestions(): Promise<void> {
		await this.saveButton.click();
	}

	// Utility methods
	async getQuestionTitle(index: number): Promise<string> {
		return (await this.questionSelector(index).locator('.question-title-statement').textContent()) || '';
	}

	async isQuestionExpanded(index: number): Promise<boolean> {
		const panel = this.questionSelector(index).locator('.panel-question-card');
		return await panel.isVisible();
	}

	async getQuestionType(index: number): Promise<string> {
		return await this.questionTypeSelect(index).inputValue();
	}

	async isQuestionMandatory(index: number): Promise<boolean> {
		return await this.questionMandatoryCheckbox(index).isChecked();
	}

	// Check if specific question type options are visible
	async areAnswerOptionsVisible(questionIndex: number): Promise<boolean> {
		return await this.questionSelector(questionIndex).locator('.questionnaire-question-answer-options').isVisible();
	}

	async areMatrixRowsVisible(questionIndex: number): Promise<boolean> {
		return await this.questionSelector(questionIndex).locator('.questionnaire-question-matrix-rows').isVisible();
	}

	async areDisplayConditionsVisible(questionIndex: number): Promise<boolean> {
		return await this.questionSelector(questionIndex)
			.locator('.questionnaire-question-display-conditions')
			.isVisible();
	}
}
