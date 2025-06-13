import { test as cleanup } from '@playwright/test';
import * as fs from 'fs';
import { STORAGE_STATE } from '../utils/constants';

/**
 * Global cleanup for authentication states.
 * This file is executed after tests to clean up authentication files.
 */

cleanup('cleanup user auth state', async () => {
	console.log('Cleaning up user authentication state...');

	try {
		if (fs.existsSync(STORAGE_STATE.USER)) {
			fs.unlinkSync(STORAGE_STATE.USER);
			console.log('User auth state cleaned up');
		}
	} catch (error) {
		console.warn('Failed to clean up user auth state:', error);
	}
});
