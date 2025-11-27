// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
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
