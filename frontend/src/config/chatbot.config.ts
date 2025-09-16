import { ApiConfigConstructor } from '@app/core/api-client/models/api-config.model';

export interface ChatbotConfig {
	backend: {
		baseUrl: string;
		api: ApiConfigConstructor[];
	};
	toastr: {
		duration: number;
	};
	logger: {
		level: string;
	};
	appName: string;
}

// Environment variable getter that works in both Vite and Jest environments
const getEnvVar = (key: string, defaultValue: string): string => {
	// In test environment or Node.js, use process.env
	if (typeof process !== 'undefined' && process.env) {
		return process.env[key] || defaultValue;
	}

	// In browser/Vite environment, environment variables are typically injected at build time
	// For now, return the default value in browser environment
	return defaultValue;
};

export const chatbotConfig: ChatbotConfig = {
	backend: {
		baseUrl: getEnvVar('BACKEND_URL', 'http://localhost:3002'),
		api: [
			{
				name: 'chatMessage',
				url: '/api/v1/chat/',
				method: 'post',
				headers: {
					'Content-Type': 'application/json'
				}
			},
			{
				name: 'supportSend',
				url: '/api/v1/support/send',
				method: 'post',
				headers: {
					'Content-Type': 'application/json'
				}
			}
		]
	},
	toastr: {
		duration: 5000
	},
	logger: {
		level: 'info'
	},
	appName: 'EU LDT Participate Chatbot'
};
