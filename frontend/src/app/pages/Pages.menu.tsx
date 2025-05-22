import { MenuItem } from '@app/core/models/menuItem.model';
import HomeIcon from '@mui/icons-material/Home';

export enum MenuLevel {
	PRIMARY = 'PRIMARY',
	SECONDARY = 'SECONDARY'
}

const pagesMenuItems: MenuItem[] = [
	{
		title: 'menu.dashboard.title',
		description: 'menu.dashboard.description',
		icon: HomeIcon,
		link: '/dashboard',
		home: true,
		data: {
			permission: 'view',
			resource: 'dashboard'
		}
	}
];

export const getMenuItems: () => MenuItem[] = () => {
	return pagesMenuItems;
};
