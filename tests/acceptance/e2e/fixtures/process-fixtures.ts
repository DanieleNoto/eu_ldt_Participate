/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Denis Vasilev Dimchev
 * Gianfranco Cedro
 */

import { CompleteProcessData } from '../pages/pages/admin/processes/ProcessAdminPage';

// Test data generators for different scenarios
export class ProcessTestDataGenerator {
	static generateValidProcessData(uniqueId: string = Date.now().toString()): CompleteProcessData {
		return {
			general: {
				title: `Test Process ${uniqueId}`,
				subtitle: `Subtitle for Process ${uniqueId}`,
				orderPosition: parseInt(uniqueId.slice(-2)) || 1,
				urlSlug: `test-process-${uniqueId}`,
				shortDescription: `Short description for test process ${uniqueId}`,
				hashtag: `TestProcess${uniqueId}`,
				description: `Detailed description for test process ${uniqueId}. This process will test various feedback mechanisms.`,
				announcement: `Test announcement for process ${uniqueId}`
			},
			duration: {
				startDate: '01/06/2025',
				endDate: '30/06/2025'
			},
			metadata: {
				developerGroup: `Test Group ${uniqueId}`,
				localArea: `Test Area ${uniqueId}`,
				metaScope: `Test Scope ${uniqueId}`,
				target: `Test Target ${uniqueId}`,
				participatoryScope: `Test Participatory Scope ${uniqueId}`,
				participatoryStructure: `Test Structure ${uniqueId}`
			},
			visibility: 'public'
		};
	}

	static generateInvalidProcessData(): Partial<CompleteProcessData> {
		return {
			general: {
				title: '', // Missing required field
				subtitle: 'Test',
				orderPosition: -1,
				urlSlug: '', // Missing required field
				shortDescription: '',
				hashtag: '',
				description: '',
				announcement: ''
			}
		};
	}

	static generateMinimalValidProcessData(): CompleteProcessData {
		const uniqueId = Date.now().toString();
		return {
			general: {
				title: `Minimal Process ${uniqueId}`,
				subtitle: 'Minimal Subtitle',
				orderPosition: 1,
				urlSlug: `minimal-process-${uniqueId}`,
				shortDescription: 'Minimal description',
				hashtag: 'Minimal',
				description: 'Minimal detailed description',
				announcement: 'Minimal announcement'
			},
			duration: {
				startDate: '01/06/2025',
				endDate: '02/06/2025'
			},
			metadata: {
				developerGroup: 'Minimal Group',
				localArea: 'Minimal Area',
				metaScope: 'Minimal Scope',
				target: 'Minimal Target',
				participatoryScope: 'Minimal Participatory Scope',
				participatoryStructure: 'Minimal Structure'
			},
			visibility: 'public'
		};
	}

	static generatePrivateProcessData(): CompleteProcessData {
		const uniqueId = Date.now().toString();
		return {
			...this.generateValidProcessData(uniqueId),
			visibility: 'private',
			privateParticipants: ['participant1@example.com', 'participant2@example.com', 'participant3@example.com']
		};
	}

	static generateLongRunningProcessData(): CompleteProcessData {
		const uniqueId = Date.now().toString();
		return {
			...this.generateValidProcessData(uniqueId),
			duration: {
				startDate: '01/01/2025',
				endDate: '31/12/2025'
			}
		};
	}

	static generateUpdateProcessData(uniqueId: string = Date.now().toString()): CompleteProcessData {
		return {
			general: {
				title: `Updated Process ${uniqueId}`,
				subtitle: `Updated Subtitle for Process ${uniqueId}`,
				orderPosition: parseInt(uniqueId.slice(-2)) || 2,
				urlSlug: `updated-process-${uniqueId}`,
				shortDescription: `Updated short description for test process ${uniqueId}`,
				hashtag: `UpdatedProcess${uniqueId}`,
				description: `Updated detailed description for test process ${uniqueId}. This process has been modified to test update functionality.`,
				announcement: `Updated test announcement for process ${uniqueId}`
			},
			duration: {
				startDate: '01/07/2025',
				endDate: '30/07/2025'
			},
			metadata: {
				developerGroup: `Updated Group ${uniqueId}`,
				localArea: `Updated Area ${uniqueId}`,
				metaScope: `Updated Scope ${uniqueId}`,
				target: `Updated Target ${uniqueId}`,
				participatoryScope: `Updated Participatory Scope ${uniqueId}`,
				participatoryStructure: `Updated Structure ${uniqueId}`
			},
			visibility: 'public'
		};
	}
}
