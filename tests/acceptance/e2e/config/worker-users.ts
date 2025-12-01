/**
 * SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

/**
 * Worker-based user pool for parallel test execution.
 *
 * Each Playwright worker gets assigned a unique user from the pool
 *
 * PLAYWRIGHT_WORKER_INDEX is automatically set by Playwright for each worker.
 *
 * Usage:
 *   import { getWorkerUser } from '@config/worker-users';
 *   const user = getWorkerUser('admin'); // or 'user'
 */

export interface WorkerUser {
	email: string;
	password: string;
	role: 'admin' | 'user';
	workerIndex: number;
}

/**
 * Pool of admin users for parallel execution
 * Worker 0-2 use these accounts (admin1, admin2, admin3)
 *
 * NOTE: TEST_ADMIN_EMAIL is RESERVED for @reserved tests
 * that use the parallel-test-reserved fixture.
 * It is NOT included in the parallel pool to avoid session conflicts.
 *
 */
const ADMIN_USER_POOL: Omit<WorkerUser, 'workerIndex'>[] = [
	// admin0 is EXCLUDED - reserved for fixed-admin tests
	{
		email: process.env.TEST_ADMIN1_EMAIL || '',
		password: process.env.TEST_ADMIN1_PASSWORD || '',
		role: 'admin'
	},
	{
		email: process.env.TEST_ADMIN2_EMAIL || '',
		password: process.env.TEST_ADMIN2_PASSWORD || '',
		role: 'admin'
	},
	{
		email: process.env.TEST_ADMIN3_EMAIL || '',
		password: process.env.TEST_ADMIN3_PASSWORD || '',
		role: 'admin'
	}
];

/**
 * Pool of regular users for parallel execution
 * Worker 0-2 use these accounts (user1, user2, user3)
 *
 * NOTE: TEST_USER_EMAIL is RESERVED for @reserved tests
 * that use the parallel-test-reserved fixture.
 * It is NOT included in the parallel pool to avoid session conflicts.
 *
 */
const USER_POOL: Omit<WorkerUser, 'workerIndex'>[] = [
	// user0 is EXCLUDED - reserved for fixed-user tests
	{
		email: process.env.TEST_USER1_EMAIL || '',
		password: process.env.TEST_USER1_PASSWORD || '',
		role: 'user'
	},
	{
		email: process.env.TEST_USER2_EMAIL || '',
		password: process.env.TEST_USER2_PASSWORD || '',
		role: 'user'
	},
	{
		email: process.env.TEST_USER3_EMAIL || '',
		password: process.env.TEST_USER3_PASSWORD || '',
		role: 'user'
	}
];

/**
 * Get the current worker index from Playwright environment.
 *
 * NOTE: This function is for use OUTSIDE of tests (e.g., in setup files).
 * Inside tests, use `test.info().parallelIndex` instead, which is more reliable.
 *
 * Falls back to 0 if not in parallel mode.
 */
export function getWorkerIndex(): number {
	// Playwright sets this for parallel workers
	const workerIndex = parseInt(process.env.TEST_PARALLEL_INDEX || '0', 10);
	return isNaN(workerIndex) ? 0 : workerIndex;
}

/**
 * Get a user from the pool based on worker index and role type.
 * Uses modulo to cycle through users if there are more workers than users.
 *
 * @param role - 'admin' or 'user'
 * @param workerIndexOverride - Optional override for worker index (for testing)
 * @returns The user credentials for this worker
 */
export function getWorkerUser(role: 'admin' | 'user', workerIndexOverride?: number): WorkerUser {
	const workerIndex = workerIndexOverride ?? getWorkerIndex();
	const pool = role === 'admin' ? ADMIN_USER_POOL : USER_POOL;
	const userIndex = workerIndex % pool.length;

	return {
		...pool[userIndex],
		workerIndex
	};
}

/**
 * Get all users of a specific role (for setup purposes)
 */
export function getAllUsers(role: 'admin' | 'user'): Omit<WorkerUser, 'workerIndex'>[] {
	return role === 'admin' ? ADMIN_USER_POOL : USER_POOL;
}

/**
 * Get the number of available users for a role
 */
export function getUserPoolSize(role: 'admin' | 'user'): number {
	return role === 'admin' ? ADMIN_USER_POOL.length : USER_POOL.length;
}
