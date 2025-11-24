// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
import { SvgIconTypeMap } from '@mui/material';
import { OverridableComponent } from '@mui/material/OverridableComponent';
import { ReactNode } from 'react';
import { IconKey } from '@app/shared/Icon/CustomIcon';

export interface MenuItem {
	title: string;
	description?: string;
	icon?: ReactNode | (OverridableComponent<SvgIconTypeMap> & { muiName: string });
	iconKey?: IconKey;
	link?: string;
	disabled?: boolean;
	home?: boolean;
	hidden?: boolean;
	sectionTitle?: string | null;
	children?: MenuItem[];
	data?: {
		permission: string;
		resource: string;
	};
}
