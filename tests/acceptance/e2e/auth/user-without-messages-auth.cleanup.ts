import { test as cleanup } from '@playwright/test';
import * as fs from 'fs';
import { STORAGE_STATE } from '../utils/constants';

/**
 * Global cleanup for authentication states.
 * This file is executed after tests to clean up authentication files.
 */

cleanup('cleanup user without messages auth state', async () => {
	console.log('Cleaning up user without messages authentication state...');

	try {
		if (fs.existsSync(STORAGE_STATE.USER_WITHOUT_MESSAGES)) {
			fs.unlinkSync(STORAGE_STATE.USER_WITHOUT_MESSAGES);
			console.log('User without messages auth state cleaned up');
		}
	} catch (error) {
		console.warn('Failed to clean up user auth state:', error);
	}
});
