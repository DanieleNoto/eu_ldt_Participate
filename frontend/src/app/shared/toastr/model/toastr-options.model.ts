/**
 * Toastr options. Setting toastr style
 */
export interface ToastrOptions {
	/**
	 * Show Close button
	 */
	showClose?: boolean;
	/**
	 * Status
	 */
	status?: ToastrStatus;
	style?: {
		containerClass?: string;
		titleClass?: string;
	};
}

export type ToastrVerticalPosition = 'top' | 'bottom';
export type ToastrHorizontalPosition = 'left' | 'right' | 'center';

export type ToastrStatus = 'info' | 'success' | 'warning' | 'error';
