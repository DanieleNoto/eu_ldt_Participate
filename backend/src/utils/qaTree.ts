import fs from 'fs';
import path from 'path';

export interface QANode {
  id: string;
  questionKey: string;
  answerKey?: string;
  children: Array<{ id: string; labelKey: string }>;
  handler?: string;
}

const TREE_PATH = path.join(__dirname, '..', 'config', 'qaTree.json');

export function loadTree(): Record<string, QANode> {
  const raw = fs.readFileSync(TREE_PATH, 'utf-8');
  return JSON.parse(raw) as Record<string, QANode>;
}