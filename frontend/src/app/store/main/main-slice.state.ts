import { MenuItem } from '@app/core/models/menuItem.model';
import { SectionModel } from '@app/theme/components/section/section.model';

export interface AppError {
	message: string;
	code?: string;
	details?: unknown;
}

export interface MainSliceState {
	appIsLoaded: boolean;
	loadingSpinner: number;
	error: AppError | null;
	appIsStandalone: boolean;
	isMainMenuActive: boolean;
	isMenuActive: boolean;
	section: SectionModel | null;
	menuItems: MenuItem[];
}
