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

const getEnvVar = (key: string, defaultValue: string): string => {
	return import.meta.env[key] || defaultValue;
};

export const chatbotConfig: ChatbotConfig = {
	backend: {
		baseUrl: getEnvVar('BACKEND_URL', 'http://localhost:3000'),
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
