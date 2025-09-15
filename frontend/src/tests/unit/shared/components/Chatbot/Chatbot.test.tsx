// @ts-nocheck
import '@testing-library/jest-dom';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import Chatbot from '@app/shared/components/Chatbot/Chatbot';
import useApiRequest from '@app/core/api-client/useApiRequest';
import { ChatResponseModel, SupportResponseModel } from '@app/shared/components/Chatbot/models/chat.models';

// Mock dependencies
jest.mock('@app/core/api-client/useApiRequest');
jest.mock('uuid', () => ({
	v4: jest.fn()
}));

// Mock scrollIntoView since it's not available in JSDOM
global.Element.prototype.scrollIntoView = jest.fn();

// Mock Material-UI icons
jest.mock('@mui/icons-material/ChatBubbleOutline', () => {
	return () => <div data-testid="chat-bubble-icon" />;
});

jest.mock('@mui/icons-material/Person', () => {
	return () => <div data-testid="person-icon" />;
});

jest.mock('@mui/icons-material/Close', () => {
	return () => <div data-testid="close-icon" />;
});

jest.mock('@mui/icons-material/ArrowBack', () => {
	return () => <div data-testid="arrow-back-icon" />;
});

const mockUseApiRequest = useApiRequest as jest.MockedFunction<typeof useApiRequest>;

// Setup i18n for tests
i18n.init({
	lng: 'en',
	fallbackLng: 'en',
	defaultNS: 'common',
	ns: ['common'],
	resources: {
		en: {
			common: {
				chatbot: {
					title: "Chat",
					openHelpAssistant: "Open help assistant",
					closeHelpAssistant: "Close help assistant",
					goBackToFaqList: "Go back to FAQ list",
					chatWithVirtualAssistant: "Chat with the virtual assistant",
					suggestions: "Suggestions",
					hereArePossibleAnswers: "Here are possible answers related to the question:",
					ifYouNeedMoreHelp: "If you need more help:",
					askSupport: "Ask support",
					orSelectAnotherTopic: "Or select another topic:",
					describeYourIssue: "Describe your issue",
					typeHere: "Type here...",
					cancel: "Cancel",
					send: "Send",
					supportRequestSent: "Support request sent. Our team will contact you."
				}
			}
		}
	},
	interpolation: {
		escapeValue: false
	}
});

const renderWithI18n = (component: React.ReactElement) => {
	return render(
		<I18nextProvider i18n={i18n}>
			{component}
		</I18nextProvider>
	);
};

describe('Chatbot Component', () => {
	const mockChatApi = {
		request: jest.fn(),
		requestBlob: jest.fn(),
		requestList: jest.fn(),
		requestWithOptions: jest.fn()
	};

	const mockSupportApi = {
		request: jest.fn(),
		requestBlob: jest.fn(),
		requestList: jest.fn(),
		requestWithOptions: jest.fn()
	};

	let uuidCounter = 0;

	beforeEach(() => {
		// Clean up DOM between tests
		cleanup();
		
		// Reset UUID counter and clear all mocks
		uuidCounter = 0;
		jest.clearAllMocks();
		
		// Generate unique UUIDs for each test to prevent React key conflicts
		jest.mocked(jest.requireMock('uuid').v4).mockImplementation(() => `test-uuid-${++uuidCounter}`);
		
		mockUseApiRequest.mockImplementation((config) => {
			if (config.model === ChatResponseModel) {
				return mockChatApi as ReturnType<typeof useApiRequest>;
			}
			if (config.model === SupportResponseModel) {
				return mockSupportApi as ReturnType<typeof useApiRequest>;
			}
			return {
				request: jest.fn(),
				requestBlob: jest.fn(),
				requestList: jest.fn(),
				requestWithOptions: jest.fn()
			} as ReturnType<typeof useApiRequest>;
		});

		// Setup default API responses
		mockChatApi.requestWithOptions.mockResolvedValue({
			conversationId: 'test-conversation-1',
			answer: 'How can I help you?',
			suggestions: [],
			faqs: [],
			options: [{ action: 'support', label: 'Contact support' }]
		});

		mockSupportApi.requestWithOptions.mockResolvedValue({
			response: 'Support request sent. Our team will contact you.'
		});
	});

	afterEach(() => {
		cleanup();
	});

	describe('Initial State', () => {
		it('renders floating button when closed', () => {
			renderWithI18n(<Chatbot />);
			
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			expect(floatingButton).toBeInTheDocument();
			expect(floatingButton).toHaveClass('fixed', 'bottom-5', 'right-5');
		});

		it('does not show chat dialog initially', () => {
			renderWithI18n(<Chatbot />);
			
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});
	});

	describe('Chat Opening and Closing', () => {
		it('opens chat dialog when floating button is clicked', async () => {
			const user = userEvent.setup();
			renderWithI18n(<Chatbot />);
			
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			await user.click(floatingButton);
			
			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});

		it('makes API call when chat is opened', async () => {
			const user = userEvent.setup();
			renderWithI18n(<Chatbot />);
			
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			await user.click(floatingButton);
			
			await waitFor(() => {
				expect(mockChatApi.requestWithOptions).toHaveBeenCalledWith({
					body: { 
						conversationId: undefined,
						nodeId: undefined,
						language: 'en'
					}
				});
			});
		});

		it('closes dialog when close button is clicked', async () => {
			const user = userEvent.setup();
			renderWithI18n(<Chatbot />);
			
			// Open dialog
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			await user.click(floatingButton);
			
			// Wait for dialog to appear
			await waitFor(() => {
				expect(screen.getByRole('dialog')).toBeInTheDocument();
			});
			
			// Close dialog
			const closeButton = screen.getByRole('button', { name: /close help assistant/i });
			await user.click(closeButton);
			
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});
	});

	describe('Chat Functionality', () => {
		it('displays API response in chat', async () => {
			const user = userEvent.setup();
			renderWithI18n(<Chatbot />);
			
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			await user.click(floatingButton);
			
			await waitFor(() => {
				expect(screen.getAllByText('How can I help you?')[0]).toBeInTheDocument();
			});
		});

		it('sends suggestion when suggestion button is clicked', async () => {
			mockChatApi.requestWithOptions
				.mockResolvedValueOnce({
					conversationId: 'test-conversation-1',
					answer: 'Hello! How can I help you?',
					suggestions: [{ id: 'sug1', text: 'Billing questions' }],
					faqs: [],
					options: []
				})
				.mockResolvedValueOnce({
					conversationId: 'test-conversation-1',
					answer: 'Here are billing options',
					suggestions: [],
					faqs: [],
					options: []
				});

			const user = userEvent.setup();
			renderWithI18n(<Chatbot />);
			
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			await user.click(floatingButton);
			
			await waitFor(() => {
				expect(screen.getByRole('button', { name: 'Billing questions' })).toBeInTheDocument();
			});

			const suggestionButton = screen.getByRole('button', { name: 'Billing questions' });
			await user.click(suggestionButton);

			await waitFor(() => {
				expect(mockChatApi.requestWithOptions).toHaveBeenCalledWith({
					body: { 
						conversationId: 'test-conversation-1',
						nodeId: 'sug1',
						language: 'en'
					}
				});
			});
		});

		it('displays loading state during API request', async () => {
			// Mock delayed response
			const delayedPromise = new Promise(resolve => 
				setTimeout(() => resolve({
					conversationId: 'test-conversation-1',
					answer: 'Response after loading',
					suggestions: [],
					faqs: [],
					options: []
				}), 100)
			);
			
			mockChatApi.requestWithOptions.mockReturnValue(delayedPromise);

			const user = userEvent.setup();
			renderWithI18n(<Chatbot />);
			
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			await user.click(floatingButton);

			// Should show loading state
			expect(screen.getByText('...')).toBeInTheDocument();

			// Wait for response
			await waitFor(() => {
				expect(screen.getAllByText('Response after loading')[0]).toBeInTheDocument();
			});
		});
	});

	describe('Support Mode', () => {
		it('enters support mode when support option is clicked', async () => {
			const user = userEvent.setup();
			renderWithI18n(<Chatbot />);
			
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			await user.click(floatingButton);
			
			await waitFor(() => {
				expect(mockChatApi.requestWithOptions).toHaveBeenCalled();
			});

			const supportButton = screen.getByRole('button', { name: 'Contact support' });
			await user.click(supportButton);

			expect(screen.getByLabelText(/describe your issue/i)).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
		});

		it('sends support request when Send button is clicked', async () => {
			const user = userEvent.setup();
			renderWithI18n(<Chatbot />);
			
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			await user.click(floatingButton);
			
			await waitFor(() => {
				expect(mockChatApi.requestWithOptions).toHaveBeenCalled();
			});

			const supportButton = screen.getByRole('button', { name: 'Contact support' });
			await user.click(supportButton);

			const textarea = screen.getByLabelText(/describe your issue/i);
			await user.type(textarea, 'I need help');

			const sendButton = screen.getByRole('button', { name: 'Send' });
			await user.click(sendButton);

			await waitFor(() => {
				expect(mockSupportApi.requestWithOptions).toHaveBeenCalledWith({
					body: { conversationId: 'test-conversation-1', message: 'I need help' }
				});
			});
		});

		it('cancels support mode when Cancel button is clicked', async () => {
			const user = userEvent.setup();
			renderWithI18n(<Chatbot />);
			
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			await user.click(floatingButton);
			
			await waitFor(() => {
				expect(mockChatApi.requestWithOptions).toHaveBeenCalled();
			});

			const supportButton = screen.getByRole('button', { name: 'Contact support' });
			await user.click(supportButton);

			expect(screen.getByLabelText(/describe your issue/i)).toBeInTheDocument();

			const cancelButton = screen.getByRole('button', { name: 'Cancel' });
			await user.click(cancelButton);

			expect(screen.queryByLabelText(/describe your issue/i)).not.toBeInTheDocument();
		});

		it('handles Enter key in support textarea', async () => {
			const user = userEvent.setup();
			renderWithI18n(<Chatbot />);
			
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			await user.click(floatingButton);
			
			await waitFor(() => {
				expect(mockChatApi.requestWithOptions).toHaveBeenCalled();
			});

			const supportButton = screen.getByRole('button', { name: 'Contact support' });
			await user.click(supportButton);

			const textarea = screen.getByLabelText(/describe your issue/i);
			await user.type(textarea, 'I need help');
			await user.keyboard('{Enter}');

			await waitFor(() => {
				expect(mockSupportApi.requestWithOptions).toHaveBeenCalledWith({
					body: { conversationId: 'test-conversation-1', message: 'I need help' }
				});
			});
		});

		it('handles Shift+Enter for new lines in textarea', async () => {
			const user = userEvent.setup();
			renderWithI18n(<Chatbot />);
			
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			await user.click(floatingButton);
			
			await waitFor(() => {
				expect(mockChatApi.requestWithOptions).toHaveBeenCalled();
			});

			const supportButton = screen.getByRole('button', { name: 'Contact support' });
			await user.click(supportButton);

			const textarea = screen.getByLabelText(/describe your issue/i);
			await user.type(textarea, 'Line 1');
			await user.keyboard('{Shift>}{Enter}{/Shift}');
			await user.type(textarea, 'Line 2');

			expect(textarea).toHaveValue('Line 1\nLine 2');
			expect(mockSupportApi.requestWithOptions).not.toHaveBeenCalled();
		});

		it('disables Send button when textarea is empty', async () => {
			const user = userEvent.setup();
			renderWithI18n(<Chatbot />);
			
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			await user.click(floatingButton);
			
			await waitFor(() => {
				expect(mockChatApi.requestWithOptions).toHaveBeenCalled();
			});

			const supportButton = screen.getByRole('button', { name: 'Contact support' });
			await user.click(supportButton);

			const sendButton = screen.getByRole('button', { name: 'Send' });
			expect(sendButton).toBeDisabled();
		});

		it('calls onSupportSent callback when provided', async () => {
			const onSupportSent = jest.fn();
			const user = userEvent.setup();
			
			mockSupportApi.requestWithOptions.mockResolvedValue({
				response: 'Support request sent successfully'
			});

			renderWithI18n(<Chatbot onSupportSent={onSupportSent} />);
			
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			await user.click(floatingButton);
			
			await waitFor(() => {
				expect(mockChatApi.requestWithOptions).toHaveBeenCalled();
			});

			const supportButton = screen.getByRole('button', { name: 'Contact support' });
			await user.click(supportButton);

			const textarea = screen.getByLabelText(/describe your issue/i);
			await user.type(textarea, 'I need help');

			const sendButton = screen.getByRole('button', { name: 'Send' });
			await user.click(sendButton);

			await waitFor(() => {
				expect(onSupportSent).toHaveBeenCalled();
			});
		});
	});

	describe('FAQ Functionality', () => {
		beforeEach(() => {
			mockChatApi.requestWithOptions
				.mockResolvedValueOnce({
					conversationId: 'test-conversation-1',
					answer: 'Hello! How can I help you?',
					suggestions: [{ id: 'sug1', text: 'Billing questions' }],
					faqs: [],
					options: []
				})
				.mockResolvedValueOnce({
					conversationId: 'test-conversation-1',
					answer: 'Here are some FAQs about billing:',
					suggestions: [{ id: 'sug2', text: 'Other topics' }],
					faqs: [
						{ id: 'faq1', question: 'How do I pay my bill?', answer: 'You can pay online through our portal.' },
						{ id: 'faq2', question: 'When is payment due?', answer: 'Payment is due on the 15th of each month.' }
					],
					options: []
				});
		});

		it('displays FAQ list after suggestion click', async () => {
			const user = userEvent.setup();
			renderWithI18n(<Chatbot />);
			
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			await user.click(floatingButton);
			
			await waitFor(() => {
				expect(screen.getByRole('button', { name: 'Billing questions' })).toBeInTheDocument();
			});

			const suggestionButton = screen.getByRole('button', { name: 'Billing questions' });
			await user.click(suggestionButton);

			await waitFor(() => {
				expect(screen.getAllByText('Here are some FAQs about billing:')[0]).toBeInTheDocument();
				expect(screen.getByRole('button', { name: 'How do I pay my bill?' })).toBeInTheDocument();
				expect(screen.getByRole('button', { name: 'When is payment due?' })).toBeInTheDocument();
			});
		});

		it('enters FAQ detail mode when FAQ question is clicked', async () => {
			const user = userEvent.setup();
			renderWithI18n(<Chatbot />);
			
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			await user.click(floatingButton);
			
			await waitFor(() => {
				expect(screen.getByRole('button', { name: 'Billing questions' })).toBeInTheDocument();
			});

			const suggestionButton = screen.getByRole('button', { name: 'Billing questions' });
			await user.click(suggestionButton);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: 'How do I pay my bill?' })).toBeInTheDocument();
			});

			const faqButton = screen.getByRole('button', { name: 'How do I pay my bill?' });
			await user.click(faqButton);

			expect(screen.getByText('Billing questions')).toBeInTheDocument(); // Header title
			expect(screen.getByText('You can pay online through our portal.')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /go back to faq list/i })).toBeInTheDocument();
		});

		it('goes back from FAQ detail mode when back button is clicked', async () => {
			const user = userEvent.setup();
			renderWithI18n(<Chatbot />);
			
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			await user.click(floatingButton);
			
			await waitFor(() => {
				expect(screen.getByRole('button', { name: 'Billing questions' })).toBeInTheDocument();
			});

			const suggestionButton = screen.getByRole('button', { name: 'Billing questions' });
			await user.click(suggestionButton);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: 'How do I pay my bill?' })).toBeInTheDocument();
			});

			const faqButton = screen.getByRole('button', { name: 'How do I pay my bill?' });
			await user.click(faqButton);

			const backButton = screen.getByRole('button', { name: /go back to faq list/i });
			await user.click(backButton);

			// Should be back to FAQ list
			expect(screen.getByRole('button', { name: 'How do I pay my bill?' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'When is payment due?' })).toBeInTheDocument();
		});

		it('shows ask support button in FAQ detail mode', async () => {
			const user = userEvent.setup();
			renderWithI18n(<Chatbot />);
			
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			await user.click(floatingButton);
			
			await waitFor(() => {
				expect(screen.getByRole('button', { name: 'Billing questions' })).toBeInTheDocument();
			});

			const suggestionButton = screen.getByRole('button', { name: 'Billing questions' });
			await user.click(suggestionButton);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: 'How do I pay my bill?' })).toBeInTheDocument();
			});

			const faqButton = screen.getByRole('button', { name: 'How do I pay my bill?' });
			await user.click(faqButton);

			expect(screen.getByRole('button', { name: 'Ask support' })).toBeInTheDocument();
		});
	});

	describe('Additional Features', () => {
		it('handles restart option correctly', async () => {
			const user = userEvent.setup();
			
			mockChatApi.requestWithOptions
				.mockResolvedValueOnce({
					conversationId: 'test-conversation-1',
					answer: 'Initial response',
					suggestions: [],
					faqs: [],
					options: [{ action: 'restart', label: 'Start over' }]
				})
				.mockResolvedValueOnce({
					conversationId: 'new-conversation-id',
					answer: 'Restarted conversation',
					suggestions: [],
					faqs: [],
					options: []
				});

			renderWithI18n(<Chatbot />);
			
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			await user.click(floatingButton);
			
			await waitFor(() => {
				expect(screen.getAllByText('Initial response')[0]).toBeInTheDocument();
			});

			const restartButton = screen.getByRole('button', { name: 'Start over' });
			await user.click(restartButton);

			await waitFor(() => {
				expect(screen.getAllByText('Restarted conversation')).toHaveLength(2);
			});
		});

		it('shows custom className when provided', async () => {
			const user = userEvent.setup();
			renderWithI18n(<Chatbot className="custom-test-class" />);
			
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			await user.click(floatingButton);
			
			const dialog = screen.getByRole('dialog');
			expect(dialog).toHaveClass('custom-test-class');
		});

		it('handles multiple messages in conversation', async () => {
			const user = userEvent.setup();
			
			mockChatApi.requestWithOptions
				.mockResolvedValueOnce({
					conversationId: 'test-conversation-1',
					answer: 'First response',
					suggestions: [{ id: 'sug1', text: 'Continue' }],
					faqs: [],
					options: []
				})
				.mockResolvedValueOnce({
					conversationId: 'test-conversation-1',
					answer: 'Second response',
					suggestions: [],
					faqs: [],
					options: []
				});

			renderWithI18n(<Chatbot />);
			
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			await user.click(floatingButton);
			
			await waitFor(() => {
				expect(screen.getAllByText('First response')[0]).toBeInTheDocument();
			});

			const continueButton = screen.getByRole('button', { name: 'Continue' });
			await user.click(continueButton);

			await waitFor(() => {
				expect(screen.getAllByText('Second response')).toHaveLength(2);
				expect(screen.getByText('Continue')).toBeInTheDocument(); // User message
			});
		});
	});

	describe('Error Handling', () => {
		it('handles chat API errors gracefully', async () => {
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
			const user = userEvent.setup();
			
			mockChatApi.requestWithOptions.mockRejectedValue(new Error('API Error'));

			renderWithI18n(<Chatbot />);
			
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			await user.click(floatingButton);

			await waitFor(() => {
				expect(consoleSpy).toHaveBeenCalledWith('Chat request failed:', expect.any(Error));
			}, { timeout: 3000 });

			consoleSpy.mockRestore();
		});

		it('handles support API errors gracefully', async () => {
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
			const user = userEvent.setup();
			
			mockChatApi.requestWithOptions.mockResolvedValue({
				conversationId: 'test-conversation-1',
				answer: 'How can I help you?',
				suggestions: [],
				faqs: [],
				options: [{ action: 'support', label: 'Contact support' }]
			});

			mockSupportApi.requestWithOptions.mockRejectedValue(new Error('Support API Error'));

			renderWithI18n(<Chatbot />);
			
			const floatingButton = screen.getByRole('button', { name: /open help assistant/i });
			await user.click(floatingButton);
			
			await waitFor(() => {
				expect(mockChatApi.requestWithOptions).toHaveBeenCalled();
			});

			const supportButton = screen.getByRole('button', { name: 'Contact support' });
			await user.click(supportButton);

			const textarea = screen.getByLabelText(/describe your issue/i);
			await user.type(textarea, 'I need help');

			const sendButton = screen.getByRole('button', { name: 'Send' });
			await user.click(sendButton);

			await waitFor(() => {
				expect(consoleSpy).toHaveBeenCalledWith('Support request failed:', expect.any(Error));
			}, { timeout: 3000 });

			consoleSpy.mockRestore();
		});
	});
});
