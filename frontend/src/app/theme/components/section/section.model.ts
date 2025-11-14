import { ReactNode } from 'react';
import { IconKey } from '@app/shared/Icon/CustomIcon';

export interface SectionModel {
	id: string;
	title: string;
	description?: string;
	iconKey?: IconKey;
	content?: ReactNode;
}
