import { ReactNode } from 'react';

interface TemplateModalProps {
	id: string;
	title: string;
	titleIcon?: ReactNode;
	defaultAction: boolean;
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string;
	children?: ReactNode;
	onClose: () => void;
	onConfirm: () => void;
}
export default TemplateModalProps;
