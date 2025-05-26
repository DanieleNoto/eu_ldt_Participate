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
