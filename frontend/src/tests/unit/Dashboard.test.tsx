import useApiRequest from '@app/core/api-client/useApiRequest';
import Dashboard from '@app/pages/dashboard/Dashboard';
import { selectConfig } from '@app/store/config/config-slice.selectors';
import { useAppSelector } from '@app/store/hook';
import { selectAppIsStandalone } from '@app/store/main/main-slice.selectors';
import { useQuery } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const mockDispatch = jest.fn();
jest.mock('@app/store/hook', () => ({
	useAppSelector: jest.fn(),
	useAppDispatch: jest.fn(() => mockDispatch)
}));

jest.mock('@app/core/logger/logger', () => ({
	__esModule: true, // it is needed because logger is a default export
	default: jest.fn(() => ({
		logger: {
			warn: jest.fn(),
			error: jest.fn(),
			info: jest.fn()
		},
		createInfoMessage: jest.fn()
	}))
}));

i18n.use(initReactI18next).init({
	lng: 'en',
	fallbackLng: 'en',
	ns: ['common'],
	defaultNS: 'common',
	resources: {
		en: {
			common: {}
		}
	},
	interpolation: {
		escapeValue: false
	}
});

const mockSelectors = (isStandalone: boolean) => {
	(useAppSelector as unknown as jest.Mock).mockImplementation(selector => {
		if (selector === selectConfig) {
			return {};
		}
		if (selector === selectAppIsStandalone) {
			return isStandalone;
		}
	});
};

// Mock dependencies
jest.mock('@app/core/api-client/useApiRequest');
jest.mock('@tanstack/react-query');
describe('Dashboard', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		// Default mocks
		(useQuery as jest.Mock).mockReturnValue({
			data: {},
			isLoading: false,
			error: null
		});

		(useApiRequest as jest.Mock).mockReturnValue({
			request: jest.fn(),
			isLoading: false
		});
	});

	test('should handle API request correctly', async () => {
		mockSelectors(true);
		const mockRequest = jest.fn().mockResolvedValue({ data: { message: 'Success' } });
		(useApiRequest as jest.Mock).mockReturnValue({
			request: mockRequest
		});

		render(<Dashboard />);

		// check if dispatch was called
		expect(mockDispatch).toHaveBeenCalledTimes(2);
	});
});
