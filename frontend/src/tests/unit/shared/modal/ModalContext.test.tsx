import { ModalProvider, useModal } from '@app/shared/modal/ModalContext';
import { render, screen, fireEvent } from '@testing-library/react';

const TestComponent = () => {
	const { modals, selectedValues, openModal, closeModal, selectValue } = useModal();
	return (
		<div>
			<div data-testid="modals">{JSON.stringify(modals)}</div>
			<div data-testid="selectedValues">{JSON.stringify(selectedValues)}</div>
			<button onClick={() => openModal('testModal')}>Open Modal</button>
			<button onClick={() => closeModal('testModal')}>Close Modal</button>
			<button onClick={() => selectValue('testModal', 'value1')}>Select Value</button>
		</div>
	);
};

describe('ModalContext', () => {
	it('provides default values', () => {
		render(
			<ModalProvider>
				<TestComponent />
			</ModalProvider>
		);
		expect(screen.getByTestId('modals').textContent).toBe('{}');
		expect(screen.getByTestId('selectedValues').textContent).toBe('{}');
	});

	it('opens a modal', () => {
		render(
			<ModalProvider>
				<TestComponent />
			</ModalProvider>
		);
		fireEvent.click(screen.getByText('Open Modal'));
		expect(screen.getByTestId('modals').textContent).toContain('"testModal":true');
	});

	it('closes a modal', () => {
		render(
			<ModalProvider>
				<TestComponent />
			</ModalProvider>
		);
		fireEvent.click(screen.getByText('Open Modal'));
		fireEvent.click(screen.getByText('Close Modal'));
		expect(screen.getByTestId('modals').textContent).toContain('"testModal":false');
	});

	it('selects a value for a modal', () => {
		render(
			<ModalProvider>
				<TestComponent />
			</ModalProvider>
		);
		fireEvent.click(screen.getByText('Select Value'));
		expect(screen.getByTestId('selectedValues').textContent).toContain('"testModal":"value1"');
	});
});
