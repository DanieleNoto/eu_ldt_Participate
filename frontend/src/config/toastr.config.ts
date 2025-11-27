// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
import { ToastrHorizontalPosition, ToastrVerticalPosition } from '@shared/toastr/model/toastr-options.model';

export interface ToastrConfig {
	vertical: ToastrVerticalPosition;
	horizontal: ToastrHorizontalPosition;
	delay: number;
}

export const toastrConfig: ToastrConfig = {
	vertical: 'bottom',
	horizontal: 'right',
	delay: 5000
};
