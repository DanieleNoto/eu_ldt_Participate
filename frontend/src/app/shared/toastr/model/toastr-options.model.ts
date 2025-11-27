// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
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
