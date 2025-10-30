import ChatbotComponent from '@app/shared/components/Chatbot/Chatbot';

describe('Chatbot Component export', () => {
	it('default Chatbot component is exported and is a function', () => {
		expect(ChatbotComponent).toBeDefined();
		expect(typeof ChatbotComponent).toBe('function');
		expect(ChatbotComponent.name).toBe('Chatbot');
	});
});
