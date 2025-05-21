import { screen, fireEvent, within, act, waitFor } from '@testing-library/react';

export const compileInputTextCorrectly = async (inputTestId: string, text: string) => {
	const inputTextWrapper = screen.getByTestId(inputTestId);
	const inputText = inputTextWrapper.querySelector('textarea, input');
	if (inputText) {
		fireEvent.change(inputText, { target: { value: text } });
		fireEvent.blur(inputText);
	}
	expect(inputText).toHaveValue(text);
};

export const compileInputTextIncorrectly = async (inputTestId: string, errorText: string) => {
	const inputTextWrapper = screen.getByTestId(inputTestId);
	const inputText = inputTextWrapper.querySelector('input, textarea');
	if (inputText) {
		fireEvent.change(inputText, { target: { value: 'tmp' } }); // set a tmp value to trigger validation
		fireEvent.blur(inputText);

		await new Promise(resolve => setTimeout(resolve, 50));

		fireEvent.change(inputText, { target: { value: '' } });
		fireEvent.blur(inputText);
	}

	await waitFor(
		async () => {
			expect(await screen.findByText(errorText)).toBeInTheDocument();
		},
		{ timeout: 3000 }
	);
};

export const compileInputTextTooLongDigits = async (inputTestId: string, maxDigits: number, errorText: string) => {
	const inputTextWrapper = screen.getByTestId(inputTestId);
	const inputText = inputTextWrapper.querySelector('input, textarea');
	if (inputText) {
		const longText = 'A'.repeat(maxDigits + 1);
		fireEvent.change(inputText, { target: { value: longText } });
		fireEvent.blur(inputText);
	}
	await waitFor(
		async () => {
			expect(await screen.findByText(errorText)).toBeInTheDocument();
		},
		{ timeout: 3000 }
	);
};

export const compileSelectCorrectly = async (selectTestId: string, optionTestId: string) => {
	const selectContainer = screen.getByTestId(selectTestId);
	expect(selectContainer).toBeInTheDocument();

	const combobox = within(selectContainer).getByRole('combobox');
	expect(combobox).toBeInTheDocument();

	fireEvent.mouseDown(combobox);

	const optionElement = screen.getByTestId(optionTestId);
	expect(optionElement).toBeInTheDocument();

	const optionText = optionElement.querySelector('p')?.textContent;

	fireEvent.mouseDown(optionElement);

	await act(async () => {
		fireEvent.click(optionElement, { key: 'Escape', code: 'Escape' });
	});

	await waitFor(() => {
		expect(screen.queryByTestId(optionTestId)).not.toBeInTheDocument();
	});

	if (optionText) {
		const inputNode = selectContainer.querySelector('input');
		if (optionText) expect(inputNode).toHaveValue(optionText);
	}
};

export const compileAsyncSelectCorrectlyByLabel = async (selectTestId: string, optionLabel: string) => {
	const selectContainer = await screen.findByTestId(selectTestId);

	const combobox = within(selectContainer).getByRole('combobox');
	fireEvent.mouseDown(combobox);

	const listbox = await screen.findByRole('listbox');

	const option = within(listbox).getByText(optionLabel);
	fireEvent.click(option);

	await waitFor(() => {
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	const inputNode = selectContainer.querySelector('input');
	expect(inputNode).toHaveValue(optionLabel);
};

export const compileSelectIncorrectly = async (selectTestId: string, placeholder: string) => {
	const selectContainer = screen.getByTestId(selectTestId);
	expect(selectContainer).toBeInTheDocument();

	const combobox = within(selectContainer).getByRole('combobox');
	expect(combobox).toBeInTheDocument();

	const placeholderContainer = within(selectContainer).getByText(placeholder);
	expect(placeholderContainer).toBeInTheDocument();

	fireEvent.mouseDown(combobox);

	await act(async () => {
		fireEvent.click(combobox, { key: 'Escape', code: 'Escape' });
	});

	expect(placeholderContainer).toBeInTheDocument();
};
