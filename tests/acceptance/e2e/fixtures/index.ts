// Re-export all fixtures for easy import
export { expect as adminExpect, adminTest } from './admin-fixtures';
export {
	expect as extraUserFieldsExpect,
	extraUserFieldsTest,
	ExtraUserFieldsTestDataGenerator
} from './extra-user-fields-fixtures';
export { expect as processExpect, processTest, ProcessTestDataGenerator } from './process-fixtures';
export { expect as userExpect, userTest } from './user-fixtures';

// Re-export common types
export type {
	CompleteProcessData,
	ProcessDurationInfo,
	ProcessGeneralInfo,
	ProcessMetadataInfo
} from '../pages/admin/ProcessAdminPage';
export type { UserFieldsData } from '../pages/user/UserExtraFieldsPage';
