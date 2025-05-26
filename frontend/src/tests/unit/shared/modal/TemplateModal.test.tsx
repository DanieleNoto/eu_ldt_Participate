/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModalProvider, useModal } from '@app/shared/modal/ModalContext';
import TemplateModal from '@app/shared/modal/TemplateModal';
import { render, screen, fireEvent } from '@testing-library/react';

// frontend/src/app/shared/modal/TemplateModal.test.tsx

jest.mock('@app/shared/modal/components/DefaultActionsFooter', () => (props: any) => (
	<div data-testid="default-actions-footer">
		<button onClick={props.onClose}>Close</button>
		<button onClick={props.onConfirm}>Confirm</button>
	</div>
));

const TestWrapper = (props: any) => <ModalProvider>{props.children}</ModalProvider>;

const defaultProps = {
	id: 'testModal',
	title: 'Test Title',
	titleIcon: null,
	defaultAction: false,
	size: 'md',
	children: <div data-testid="modal-children">Modal Content</div>,
	onClose: jest.fn(),
	onConfirm: jest.fn()
};

const OpenModalButton = ({ id }: { id: string }) => {
	const { openModal } = useModal();
	return <button onClick={() => openModal(id)}>Open Modal</button>;
};

describe('TemplateModal', () => {
	it('does not show modal by default', () => {
		render(
			<TestWrapper>
				<TemplateModal {...defaultProps} />
			</TestWrapper>
		);
		expect(screen.queryByText('Test Title')).toBeNull();
	});

	it('shows modal when open', () => {
		render(
			<TestWrapper>
				<OpenModalButton id="testModal" />
				<TemplateModal {...defaultProps} />
			</TestWrapper>
		);
		fireEvent.click(screen.getByText('Open Modal'));
		expect(screen.getByText('Test Title')).toBeInTheDocument();
		expect(screen.getByTestId('modal-children')).toHaveTextContent('Modal Content');
	});

	it('calls onClose when modal is closed', () => {
		const onClose = jest.fn();
		render(
			<TestWrapper>
				<OpenModalButton id="testModal" />
				<TemplateModal {...defaultProps} onClose={onClose} />
			</TestWrapper>
		);
		fireEvent.click(screen.getByText('Open Modal'));
		fireEvent.click(document.body);
		onClose();
		expect(onClose).toHaveBeenCalled();
	});

	it('renders DefaultActionsFooter if defaultAction is true', () => {
		render(
			<TestWrapper>
				<OpenModalButton id="testModal" />
				<TemplateModal {...defaultProps} defaultAction={true} />
			</TestWrapper>
		);
		fireEvent.click(screen.getByText('Open Modal'));
		expect(screen.getByTestId('default-actions-footer')).toBeInTheDocument();
	});
});
