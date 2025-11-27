// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
import { ReactNode } from 'react';
import { IconKey } from '@app/shared/Icon/CustomIcon';

export interface SectionModel {
	id: string;
	title: string;
	description?: string;
	iconKey?: IconKey;
	content?: ReactNode;
}
