import * as fs from 'fs';
import { STORAGE_STATE } from '../utils/constants';

/**
 * Manual cleanup for authentication states.
 * This file provides a function to manually clean up authentication files.
 * Call cleanupAdminAuthState() when you need to clean up manually.
 */

/**
 * Manually clean up admin authentication state
 */
export function cleanupAdminAuthState(): void {
	console.log('Cleaning up admin authentication state...');

	try {
		if (fs.existsSync(STORAGE_STATE.ADMIN)) {
			fs.unlinkSync(STORAGE_STATE.ADMIN);
			console.log('Admin auth state cleaned up');
		} else {
			console.log('Admin auth state file does not exist, nothing to clean up');
		}
	} catch (error) {
		console.warn('Failed to clean up admin auth state:', error);
	}
}

// Uncomment the line below if you want to run cleanup when this file is executed directly
// cleanupAdminAuthState();
