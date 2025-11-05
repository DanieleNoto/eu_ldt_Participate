import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

// Handle both development and production paths
const getTreePath = () => {
	// In production (Docker), files are in /app/build/src/...
	// In development, files are in src/...
	const productionPath = path.join(__dirname, '..', 'config', 'qaTree.json');
	const developmentPath = path.join(process.cwd(), 'src', 'config', 'qaTree.json');

	// Try production path first, then development path
	if (fs.existsSync(productionPath)) {
		return productionPath;
	} else if (fs.existsSync(developmentPath)) {
		return developmentPath;
	} else {
		throw new Error(`qaTree.json not found. Tried paths: ${productionPath}, ${developmentPath}`);
	}
};

const TREE_PATH = getTreePath();

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
