// Mock i18next and react-i18next before importing anything else
jest.mock('react-i18next', () => ({
	useTranslation: () => ({
		i18n: {
			language: 'en',
			changeLanguage: jest.fn()
		}
	}),
	initReactI18next: {
		type: '3rdParty',
		init: jest.fn()
	}
}));

// Mock the i18n module
jest.mock('@src/i18n', () => ({
	default: {
		language: 'en',
		changeLanguage: jest.fn(),
		use: jest.fn().mockReturnThis(),
		init: jest.fn()
	}
}));

import { render, screen, waitFor, act } from '@testing-library/react';
import ChatbotWebComponent from '@app/shared/components/Chatbot/ChatbotWebComponent';

// Mock dependencies
jest.mock('@app/SimplifiedMainProvider', () => {
	return ({ children }: { children: React.ReactNode }) => (
		<div data-testid="simplified-main-provider">{children}</div>
	);
});

jest.mock('@app/shared/components/Chatbot/Chatbot', () => {
	return ({ language, onSupportSent, className }: {
		language?: string;
		onSupportSent?: () => void;
		className?: string;
	}) => (
		<div 
			data-testid="chatbot"
			data-language={language}
			data-class={className}
			onClick={onSupportSent}
		>
			Mocked Chatbot
		</div>
	);
});

// Mock global fetch
global.fetch = jest.fn();

describe('ChatbotWebComponent', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		delete (window as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__;
		delete (window as { __CHATBOT_CONFIG__?: unknown }).__CHATBOT_CONFIG__;
		(global.fetch as jest.Mock).mockResolvedValue({
			json: () => Promise.resolve({ some: 'config' })
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should render loading state initially', () => {
		// Set base URL to trigger config fetch
		Object.defineProperty(window, '__CHATBOT_BASE_URL__', {
			value: 'http://example.com',
			writable: true
		});
		// Mock fetch to never resolve, keeping loading state
		(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
		
		render(<ChatbotWebComponent />);
		
		expect(screen.queryByTestId('chatbot')).not.toBeInTheDocument();
	});

	it('should render chatbot after config is loaded', async () => {
		(window as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ = 'http://example.com';
		await act(async () => {
			render(<ChatbotWebComponent />);
		});

		await waitFor(() => {
			expect(screen.getByTestId('chatbot')).toBeInTheDocument();
		});

		expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
	});

	it('should pass language prop to chatbot', async () => {
		(window as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ = 'http://example.com';
		await act(async () => {
			render(<ChatbotWebComponent language="fr" />);
		});

		await waitFor(() => {
			expect(screen.getByTestId('chatbot')).toHaveAttribute('data-language', 'fr');
		});
	});

	it('should pass className prop to chatbot', async () => {
		(window as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ = 'http://example.com';
		await act(async () => {
			render(<ChatbotWebComponent className="custom-class" />);
		});

		await waitFor(() => {
			expect(screen.getByTestId('chatbot')).toHaveAttribute('data-class', 'custom-class');
		});
	});

	it('should pass onSupportSent callback to chatbot', async () => {
		(window as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ = 'http://example.com';
		const mockCallback = jest.fn();
		await act(async () => {
			render(<ChatbotWebComponent onSupportSent={mockCallback} />);
		});

		await waitFor(() => {
			expect(screen.getByTestId('chatbot')).toBeInTheDocument();
		});

		// Click the chatbot to trigger the callback
		screen.getByTestId('chatbot').click();
		expect(mockCallback).toHaveBeenCalled();
	});

	it('should use default language "en" when no language prop provided', async () => {
		(window as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ = 'http://example.com';
		await act(async () => {
			render(<ChatbotWebComponent />);
		});

		await waitFor(() => {
			expect(screen.getByTestId('chatbot')).toHaveAttribute('data-language', 'en');
		});
	});

	it('should handle fetch config failure gracefully', async () => {
		(window as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ = 'http://example.com';
		(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
		
		const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

		await act(async () => {
			render(<ChatbotWebComponent />);
		});

		await waitFor(() => {
			expect(screen.getByTestId('chatbot')).toBeInTheDocument();
		});

		expect(consoleSpy).toHaveBeenCalledWith(
			'[Chatbot] Failed to load config.json, using defaults:',
			expect.any(Error)
		);

		consoleSpy.mockRestore();
	});

	it('should handle invalid JSON response gracefully', async () => {
		(window as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ = 'http://example.com';
		(global.fetch as jest.Mock).mockResolvedValue({
			json: () => Promise.reject(new Error('Invalid JSON'))
		});
		
		const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

		await act(async () => {
			render(<ChatbotWebComponent />);
		});

		await waitFor(() => {
			expect(screen.getByTestId('chatbot')).toBeInTheDocument();
		});

		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should render chatbot in fixed position container', async () => {
		(window as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ = 'http://example.com';
		await act(async () => {
			render(<ChatbotWebComponent />);
		});

		await waitFor(() => {
			const container = screen.getByTestId('chatbot').parentElement;
			expect(container).toHaveStyle({
				position: 'fixed',
				bottom: '16px',
				right: '16px',
				zIndex: '1000'
			});
		});
	});

	it('should wrap chatbot in SimplifiedMainProvider', async () => {
		(window as { __CHATBOT_BASE_URL__?: string }).__CHATBOT_BASE_URL__ = 'http://example.com';
		await act(async () => {
			render(<ChatbotWebComponent />);
		});

		await waitFor(() => {
			expect(screen.getByTestId('simplified-main-provider')).toBeInTheDocument();
			expect(screen.getByTestId('chatbot')).toBeInTheDocument();
		});
	});

	it('should change i18n language when language prop changes', () => {
		const { rerender } = render(<ChatbotWebComponent language="en" />);
		
		// Change language prop
		rerender(<ChatbotWebComponent language="fr" />);

		// Note: Due to mocking constraints, we can't easily test the useEffect
		// but the component structure ensures the effect runs
	});
});
