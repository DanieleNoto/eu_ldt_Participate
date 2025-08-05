import { Page } from '@playwright/test';
import { TemplatesBreadcrumbComponent } from '../../../components/admin/templates/TemplatesBreadcrumbComponent';
import { TemplatesSidebarComponent } from '../../../components/admin/templates/TemplatesSidebarComponent';
import { QuestionnaireQuestionsFormComponent } from '../../../components/admin/templates/QuestionnaireQuestionsFormComponent';
import { FlashMessageComponent } from '../../../components/admin/FlashMessageComponent';

/**
 * Page object for the Questionnaire Questions Management page.
 * This page allows editing and managing questions within a questionnaire template.
 * Accessed via "Manage Questions" button from the Edit Template page.
 */
export class QuestionnaireQuestionsPage {
	public readonly breadcrumb: TemplatesBreadcrumbComponent;
	public readonly sidebar: TemplatesSidebarComponent;
	public readonly questionsForm: QuestionnaireQuestionsFormComponent;
	public readonly flashMessage: FlashMessageComponent;

	constructor(private page: Page) {
		this.breadcrumb = new TemplatesBreadcrumbComponent(page);
		this.sidebar = new TemplatesSidebarComponent(page);
		this.questionsForm = new QuestionnaireQuestionsFormComponent(page);
		this.flashMessage = new FlashMessageComponent(page);
	}

	// Page navigation
	async navigateToQuestionnaireQuestions(templateId: string | number): Promise<void> {
		await this.page.goto(`/admin/templates/questionnaire_templates/${templateId}/update_questions`);
	}

	// Wait for page to load
	async waitForPageToLoad(): Promise<void> {
		await this.page.waitForSelector('.questionnaire-questions');
		await this.page.waitForSelector('.sidebar-menu__container');
		await this.page.waitForSelector('.item__edit-form');
	}

	// Check if the entire page is loaded
	async isPageFullyLoaded(): Promise<boolean> {
		const breadcrumbLoaded = await this.breadcrumb.isBreadcrumbFullyLoaded();
		const sidebarLoaded = await this.sidebar.isSidebarFullyLoaded();
		const formLoaded = await this.questionsForm.isPageLoaded();

		return breadcrumbLoaded && sidebarLoaded && formLoaded;
	}

	// Get page title
	async getPageTitle(): Promise<string> {
		return await this.questionsForm.getPageTitle();
	}

	// Question management workflows
	async createSimpleTextQuestion(
		questionText: string,
		options?: {
			type?: 'short_answer' | 'long_answer';
			mandatory?: boolean;
			characterLimit?: number;
			language?: string;
		}
	): Promise<void> {
		await this.questionsForm.createSimpleQuestion({
			body: questionText,
			type: options?.type || 'short_answer',
			mandatory: options?.mandatory,
			characterLimit: options?.characterLimit,
			language: options?.language
		});
	}

	async createMultipleChoiceQuestion(
		questionText: string,
		choices: string[],
		options?: {
			type?: 'single_option' | 'multiple_option';
			mandatory?: boolean;
			language?: string;
		}
	): Promise<void> {
		await this.questionsForm.createQuestionWithOptions({
			body: questionText,
			type: options?.type || 'single_option',
			options: choices,
			mandatory: options?.mandatory,
			language: options?.language
		});
	}

	async addQuestionSeparator(): Promise<void> {
		await this.questionsForm.addSeparator();
	}

	async addTitleAndDescription(): Promise<void> {
		await this.questionsForm.addTitleAndDescription();
	}

	// Question organization
	async moveQuestionUp(questionIndex: number): Promise<void> {
		await this.questionsForm.moveQuestionUp(questionIndex);
	}

	async moveQuestionDown(questionIndex: number): Promise<void> {
		await this.questionsForm.moveQuestionDown(questionIndex);
	}

	async removeQuestion(questionIndex: number): Promise<void> {
		await this.questionsForm.removeQuestion(questionIndex);
	}

	async collapseAllQuestions(): Promise<void> {
		await this.questionsForm.collapseAllQuestions();
	}

	async expandAllQuestions(): Promise<void> {
		await this.questionsForm.expandAllQuestions();
	}

	// Question editing
	async editQuestionText(questionIndex: number, newText: string, language: string = 'en'): Promise<void> {
		await this.questionsForm.fillQuestionBody(questionIndex, newText, language);
	}

	async editQuestionDescription(questionIndex: number, description: string, language: string = 'en'): Promise<void> {
		await this.questionsForm.fillQuestionDescription(questionIndex, description, language);
	}

	async toggleQuestionMandatory(questionIndex: number, mandatory: boolean): Promise<void> {
		await this.questionsForm.setQuestionMandatory(questionIndex, mandatory);
	}

	async changeQuestionType(questionIndex: number, type: string): Promise<void> {
		await this.questionsForm.setQuestionType(questionIndex, type);
	}

	// Answer options management
	async addAnswerOptionToQuestion(questionIndex: number, optionText: string, language: string = 'en'): Promise<void> {
		const currentOptionsCount = await this.questionsForm.getAnswerOptionsCount(questionIndex);
		await this.questionsForm.addAnswerOption(questionIndex);
		await this.questionsForm.fillAnswerOption(questionIndex, currentOptionsCount, optionText, language);
	}

	async editAnswerOption(
		questionIndex: number,
		optionIndex: number,
		newText: string,
		language: string = 'en'
	): Promise<void> {
		await this.questionsForm.fillAnswerOption(questionIndex, optionIndex, newText, language);
	}

	async removeAnswerOption(questionIndex: number, optionIndex: number): Promise<void> {
		await this.questionsForm.removeAnswerOption(questionIndex, optionIndex);
	}

	// Save and validate
	async saveQuestions(): Promise<void> {
		await this.questionsForm.saveQuestions();
	}

	async saveQuestionsAndWaitForSuccess(): Promise<void> {
		await this.questionsForm.saveQuestions();
		await this.flashMessage.waitForSuccessMessage();
	}

	async isFormValid(): Promise<boolean> {
		return await this.questionsForm.isFormValid();
	}

	// Information gathering
	async getQuestionsCount(): Promise<number> {
		return await this.questionsForm.getQuestionsCount();
	}

	async getQuestionText(questionIndex: number): Promise<string> {
		return await this.questionsForm.getQuestionTitle(questionIndex);
	}

	async getQuestionType(questionIndex: number): Promise<string> {
		return await this.questionsForm.getQuestionType(questionIndex);
	}

	async isQuestionMandatory(questionIndex: number): Promise<boolean> {
		return await this.questionsForm.isQuestionMandatory(questionIndex);
	}

	async getAnswerOptionsCount(questionIndex: number): Promise<number> {
		return await this.questionsForm.getAnswerOptionsCount(questionIndex);
	}

	// Language support
	async switchQuestionLanguage(questionIndex: number, language: 'en' | 'ca' | 'es'): Promise<void> {
		await this.questionsForm.switchToLanguageTab(questionIndex, language);
	}

	// Multilingual question creation
	async createMultilingualQuestion(questionData: {
		body: { en: string; ca?: string; es?: string };
		description?: { en?: string; ca?: string; es?: string };
		type?: string;
		mandatory?: boolean;
		characterLimit?: number;
	}): Promise<void> {
		const currentCount = await this.getQuestionsCount();
		await this.questionsForm.addQuestion();

		const questionIndex = currentCount;

		// Fill English text (required)
		await this.questionsForm.fillQuestionBody(questionIndex, questionData.body.en, 'en');

		// Fill other languages if provided
		if (questionData.body.ca) {
			await this.questionsForm.fillQuestionBody(questionIndex, questionData.body.ca, 'ca');
		}
		if (questionData.body.es) {
			await this.questionsForm.fillQuestionBody(questionIndex, questionData.body.es, 'es');
		}

		// Fill descriptions if provided
		if (questionData.description) {
			if (questionData.description.en) {
				await this.questionsForm.fillQuestionDescription(questionIndex, questionData.description.en, 'en');
			}
			if (questionData.description.ca) {
				await this.questionsForm.fillQuestionDescription(questionIndex, questionData.description.ca, 'ca');
			}
			if (questionData.description.es) {
				await this.questionsForm.fillQuestionDescription(questionIndex, questionData.description.es, 'es');
			}
		}

		// Set other properties
		if (questionData.type) {
			await this.questionsForm.setQuestionType(questionIndex, questionData.type);
		}
		if (questionData.mandatory !== undefined) {
			await this.questionsForm.setQuestionMandatory(questionIndex, questionData.mandatory);
		}
		if (questionData.characterLimit) {
			await this.questionsForm.setCharacterLimit(questionIndex, questionData.characterLimit);
		}
	}

	// Navigation back to template
	async goBackToTemplateEdit(): Promise<void> {
		await this.breadcrumb.clickQuestionnaires();
	}

	async goToTemplatesHome(): Promise<void> {
		await this.breadcrumb.clickTemplates();
	}

	async goToAdminDashboard(): Promise<void> {
		await this.breadcrumb.clickHomeIcon();
	}

	// Page state checks
	async isOnQuestionsManagementPage(): Promise<boolean> {
		const pageTitle = await this.getPageTitle();
		const isQuestionnairesActive = await this.sidebar.isQuestionnairesActive();
		const hasTemplatesInBreadcrumb = await this.breadcrumb.isTemplatesVisible();

		return pageTitle.includes('Questions') && isQuestionnairesActive && hasTemplatesInBreadcrumb;
	}

	// Bulk operations
	async createQuestionnaireFromTemplate(
		questions: Array<{
			type: 'question' | 'separator' | 'title_description';
			body?: string;
			description?: string;
			questionType?: string;
			mandatory?: boolean;
			options?: string[];
			language?: string;
		}>
	): Promise<void> {
		for (const question of questions) {
			if (question.type === 'separator') {
				await this.addQuestionSeparator();
			} else if (question.type === 'title_description') {
				await this.addTitleAndDescription();
				if (question.body) {
					const questionIndex = (await this.getQuestionsCount()) - 1;
					await this.editQuestionText(questionIndex, question.body, question.language);
				}
			} else if (question.type === 'question' && question.body) {
				if (question.options && question.options.length > 0) {
					await this.createMultipleChoiceQuestion(question.body, question.options, {
						type: question.questionType as 'single_option' | 'multiple_option',
						mandatory: question.mandatory,
						language: question.language
					});
				} else {
					await this.createSimpleTextQuestion(question.body, {
						type: question.questionType as 'short_answer' | 'long_answer',
						mandatory: question.mandatory,
						language: question.language
					});
				}
			}
		}
	}

	// Success message handling
	async isQuestionsSavedSuccessfully(): Promise<boolean> {
		return await this.flashMessage.isSuccessMessageVisible();
	}

	async getSuccessMessage(): Promise<string> {
		return await this.flashMessage.getSuccessMessageText();
	}

	async dismissSuccessMessage(): Promise<void> {
		await this.flashMessage.closeFlashMessage();
	}
}
