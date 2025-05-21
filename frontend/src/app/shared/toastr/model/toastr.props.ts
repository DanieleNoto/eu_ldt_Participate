import { ToastrOptions } from '@shared/toastr/model/toastr-options.model';

export interface ToastrProps {
	/**
	 * Title of dialog
	 */
	title: string;
	/**
	 * Input for child component
	 */
	text?: string;
	/**
	 * onClose Callback
	 */
	onClose?: () => void;
	/**
	 * Toastr Options
	 */
	options?: ToastrOptions;
}

export type InternalToastrProps = ToastrProps & {
	uuid: string;
};
