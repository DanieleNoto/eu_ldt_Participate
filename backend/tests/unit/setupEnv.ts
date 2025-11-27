// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Gianfranco Cedro
import { sequelize } from '../../src/config/database';

// Global test cleanup
afterAll(async () => {
	// Close database connection
	try {
		await sequelize.close();
	} catch (error) {
		console.warn('Error closing database connection:', error);
	}

	// Force cleanup of any remaining handles
	jest.clearAllTimers();
	jest.clearAllMocks();

	// Give some time for async operations to complete
	await new Promise(resolve => setTimeout(resolve, 100));
});
