import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const TREE_PATH = path.join(__dirname, '..', 'config', 'qaTree.json');

const NodeSchema = z.object({
	id: z.string(),
	questionKey: z.string(),
	answerKey: z.string().optional(),
	children: z.array(z.object({ id: z.string(), labelKey: z.string() })),
	handlerId: z.string().optional(),
	handlerParams: z.unknown().optional(),
	faqs: z
		.array(
			z.object({
				id: z.string(),
				questionKey: z.string(),
				answerKey: z.string()
			})
		)
		.optional(),
	additionalSuggestions: z
		.array(
			z.object({
				id: z.string(),
				labelKey: z.string()
			})
		)
		.optional()
});
const TreeSchema = z.record(z.string(), NodeSchema);

export type QANode = z.infer<typeof NodeSchema>;
export type QATree = Record<string, QANode>;
export const loadTree = () => {
	const raw = fs.readFileSync(TREE_PATH, 'utf-8');
	const parsed = TreeSchema.parse(JSON.parse(raw));
	return parsed;
};
