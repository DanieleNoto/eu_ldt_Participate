import { z } from 'zod';

export const ChatRequestSchema = z.object({
	conversationId: z.string().uuid().optional(),
	nodeId: z.string().optional()
});

export const SuggestionSchema = z.object({ id: z.string(), text: z.string() });

export const FaqSchema = z.object({
	id: z.string(),
	question: z.string(),
	answer: z.string()
});

export const ChatResponseSchema = z.object({
	conversationId: z.string().uuid(),
	answer: z.string(),
	suggestions: z.array(SuggestionSchema),
	faqs: z.array(FaqSchema).optional(),
	isLeaf: z.boolean(),
	options: z.array(z.object({ action: z.string(), label: z.string() })).optional()
});

export const SupportRequestSchema = z.object({
	conversationId: z.string().uuid(),
	message: z.string().min(1)
});

export const SupportResponseSchema = z.object({ response: z.string() });
