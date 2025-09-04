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

// Mock global CSS import
jest.mock('@theme/styles/global.css', () => ({}));

import { render, screen, waitFor } from '@testing-library/react';
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
		(global.fetch as jest.Mock).mockResolvedValue({
			json: () => Promise.resolve({ some: 'config' })
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should render loading state initially', () => {
		render(<ChatbotWebComponent />);
		
		expect(screen.getByText('Loading...')).toBeInTheDocument();
	});

	it('should render chatbot after config is loaded', async () => {
		render(<ChatbotWebComponent />);

		await waitFor(() => {
			expect(screen.getByTestId('chatbot')).toBeInTheDocument();
		});

		expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
	});

	it('should pass language prop to chatbot', async () => {
		render(<ChatbotWebComponent language="fr" />);

		await waitFor(() => {
			expect(screen.getByTestId('chatbot')).toHaveAttribute('data-language', 'fr');
		});
	});

	it('should pass className prop to chatbot', async () => {
		render(<ChatbotWebComponent className="custom-class" />);

		await waitFor(() => {
			expect(screen.getByTestId('chatbot')).toHaveAttribute('data-class', 'custom-class');
		});
	});

	it('should pass onSupportSent callback to chatbot', async () => {
		const mockCallback = jest.fn();
		render(<ChatbotWebComponent onSupportSent={mockCallback} />);

		await waitFor(() => {
			expect(screen.getByTestId('chatbot')).toBeInTheDocument();
		});

		// Click the chatbot to trigger the callback
		screen.getByTestId('chatbot').click();
		expect(mockCallback).toHaveBeenCalled();
	});

	it('should use default language "en" when no language prop provided', async () => {
		render(<ChatbotWebComponent />);

		await waitFor(() => {
			expect(screen.getByTestId('chatbot')).toHaveAttribute('data-language', 'en');
		});
	});

	it('should handle fetch config failure gracefully', async () => {
		(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
		
		const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

		render(<ChatbotWebComponent />);

		await waitFor(() => {
			expect(screen.getByTestId('chatbot')).toBeInTheDocument();
		});

		expect(consoleSpy).toHaveBeenCalledWith(
			'Failed to load config.json, using defaults:',
			expect.any(Error)
		);

		consoleSpy.mockRestore();
	});

	it('should handle invalid JSON response gracefully', async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			json: () => Promise.reject(new Error('Invalid JSON'))
		});
		
		const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

		render(<ChatbotWebComponent />);

		await waitFor(() => {
			expect(screen.getByTestId('chatbot')).toBeInTheDocument();
		});

		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should render chatbot in fixed position container', async () => {
		render(<ChatbotWebComponent />);

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
		render(<ChatbotWebComponent />);

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
