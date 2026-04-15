/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

import { Locator } from '@playwright/test';

/**
 * Pastes text content into a tiptap/ProseMirror rich-text editor via clipboard events
 * instead of character-by-character keystrokes (which is what `fill()` does on
 * contenteditable elements in Playwright and is extremely slow in CI).
 *
 * Strategy:
 *  1. Focus the editor and select all existing content (Control+A).
 *  2. Dispatch a `ClipboardEvent('paste', { clipboardData })` — works in Chromium and WebKit.
 *  3. If the editor is still empty after step 2 (Firefox blocks setting `clipboardData` on
 *     ClipboardEvent), fall back to a `InputEvent('beforeinput', { inputType:
 *     'insertFromPaste', dataTransfer })` which Firefox does allow.
 *
 * @param editorLocator - A Playwright Locator pointing to the `.tiptap` / `.ProseMirror`
 *                        contenteditable element.
 * @param content       - The plain-text content to insert.
 */
export async function pasteTiptapContent(editorLocator: Locator, content: string): Promise<void> {
	// Focus the editor and select everything already there
	await editorLocator.click();
	await editorLocator.page().keyboard.press('Control+a');

	// Attempt 1: Chromium / WebKit — ClipboardEvent supports clipboardData
	await editorLocator.evaluate((el: Element, text: string) => {
		const dt = new DataTransfer();
		dt.setData('text/plain', text);
		el.dispatchEvent(
			new ClipboardEvent('paste', {
				clipboardData: dt,
				bubbles: true,
				cancelable: true
			})
		);
	}, content);

	// Attempt 2: Firefox fallback — Firefox blocks clipboardData on ClipboardEvent
	// but allows DataTransfer on InputEvent.
	const isEmpty = await editorLocator.evaluate((el: Element) => (el.textContent ?? '').trim() === '');
	if (isEmpty) {
		await editorLocator.evaluate((el: Element, text: string) => {
			(el as HTMLElement).focus();

			// Select all existing content so it gets replaced
			const sel = window.getSelection();
			if (sel) {
				const range = document.createRange();
				range.selectNodeContents(el);
				sel.removeAllRanges();
				sel.addRange(range);
			}

			const dt = new DataTransfer();
			dt.setData('text/plain', text);
			el.dispatchEvent(
				new InputEvent('beforeinput', {
					inputType: 'insertFromPaste',
					dataTransfer: dt,
					bubbles: true,
					cancelable: true
				})
			);
		}, content);
	}

	// Attempt 3: keyboard.type() — works in all browsers but is slower.
	// Used when both clipboard strategies leave the editor empty.
	const isStillEmpty = await editorLocator.evaluate((el: Element) => (el.textContent ?? '').trim() === '');
	if (isStillEmpty) {
		await editorLocator.click();
		await editorLocator.page().keyboard.press('Control+a');
		await editorLocator.page().keyboard.type(content);
	}
}
