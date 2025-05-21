import HomeIcon from '@mui/icons-material/Home';
import { SvgIconTypeMap } from '@mui/material';
import { OverridableComponent } from '@mui/material/OverridableComponent';
import { ReactNode } from 'react';

export interface MenuItem {
	title: string;
	description?: string;
	icon: ReactNode | (OverridableComponent<SvgIconTypeMap> & { muiName: string });
	link: string;
	home?: boolean;
	hidden?: boolean;
	children?: MenuItem[];
	data?: {
		permission: string;
		resource: string;
	};
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
