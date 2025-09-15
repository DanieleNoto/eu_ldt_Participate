import { Chatbot } from '@app/shared/components/Chatbot';
import ChatbotComponent from '@app/shared/components/Chatbot/Chatbot';

describe('Chatbot Index', () => {
	it('exports Chatbot component as named export', () => {
		expect(Chatbot).toBeDefined();
		expect(Chatbot).toBe(ChatbotComponent);
	});

	it('exports the correct component type', () => {
		expect(typeof Chatbot).toBe('function');
		expect(Chatbot.name).toBe('Chatbot');
	});
});
