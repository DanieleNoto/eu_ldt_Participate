import { test as cleanup } from '@playwright/test';
import * as fs from 'fs';
import { STORAGE_STATE } from '../utils/constants';

/**
 * Global cleanup for authentication states.
 * This file is executed after tests to clean up authentication files.
 */

cleanup('cleanup admin auth state', async () => {
	console.log('Cleaning up admin authentication state...');

	try {
		if (fs.existsSync(STORAGE_STATE.ADMIN)) {
			fs.unlinkSync(STORAGE_STATE.ADMIN);
			console.log('Admin auth state cleaned up');
		}
	} catch (error) {
		console.warn('Failed to clean up admin auth state:', error);
	}
});
