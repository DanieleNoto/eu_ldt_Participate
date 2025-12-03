/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Gianfranco Cedro
 */

// Re-export all fixtures for easy import

export { ExtraUserFieldsTestDataGenerator } from './extra-user-fields-fixtures';
export { ProcessTestDataGenerator } from './process-fixtures';

// Re-export common types
export type {
	CompleteProcessData,
	ProcessDurationInfo,
	ProcessGeneralInfo,
	ProcessMetadataInfo
} from '../pages/pages/admin/processes/ProcessAdminPage';
export type { UserFieldsData } from '../pages/pages/user/account/UserExtraFieldsPage';
