// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
import {
	HealthCheckSchema,
	HealthResponseSchema,
	ServiceStatusesResponseSchema,
	KubernetesHealthResponseSchema
} from '../../../src/schemas/health.schema';
import { HealthStatus } from '../../../src/enums/health-status.enum';

describe('Health Schemas', () => {
	describe('HealthCheckSchema', () => {
		it('should validate a valid health check', () => {
			const validCheck = {
				status: HealthStatus.HEALTHY,
				timestamp: new Date().toISOString(),
				responseTime: 100,
				details: 'All systems operational'
			};

			const result = HealthCheckSchema.safeParse(validCheck);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(validCheck);
			}
		});

		it('should validate health check without optional fields', () => {
			const minimalCheck = {
				status: HealthStatus.DEGRADED,
				timestamp: new Date().toISOString()
			};

			const result = HealthCheckSchema.safeParse(minimalCheck);
			expect(result.success).toBe(true);
		});

		it('should fail validation without required fields', () => {
			const invalidCheck = {
				status: HealthStatus.HEALTHY
			};

			const result = HealthCheckSchema.safeParse(invalidCheck);
			expect(result.success).toBe(false);
		});
	});

	describe('HealthResponseSchema', () => {
		it('should validate a complete health response', () => {
			const validResponse = {
				status: HealthStatus.HEALTHY,
				checks: {
					database: {
						status: HealthStatus.HEALTHY,
						timestamp: new Date().toISOString(),
						responseTime: 50,
						details: 'Connected'
					},
					redis: {
						status: HealthStatus.HEALTHY,
						timestamp: new Date().toISOString(),
						responseTime: 20,
						details: 'Connected'
					}
				},
				timestamp: new Date().toISOString(),
				version: '1.0.0'
			};

			const result = HealthResponseSchema.safeParse(validResponse);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(validResponse);
			}
		});

		it('should validate health response without optional version', () => {
			const responseWithoutVersion = {
				status: HealthStatus.UNHEALTHY,
				checks: {
					database: {
						status: HealthStatus.UNHEALTHY,
						timestamp: new Date().toISOString(),
						details: 'Connection failed'
					}
				},
				timestamp: new Date().toISOString()
			};

			const result = HealthResponseSchema.safeParse(responseWithoutVersion);
			expect(result.success).toBe(true);
		});

		it('should fail validation with missing required fields', () => {
			const invalidResponse = {
				status: HealthStatus.HEALTHY,
				checks: {}
			};

			const result = HealthResponseSchema.safeParse(invalidResponse);
			expect(result.success).toBe(false);
		});
	});

	describe('ServiceStatusesResponseSchema', () => {
		it('should validate service statuses map', () => {
			const validStatuses = {
				database: {
					status: HealthStatus.HEALTHY,
					timestamp: new Date().toISOString(),
					responseTime: 30
				},
				redis: {
					status: HealthStatus.DEGRADED,
					timestamp: new Date().toISOString(),
					details: 'Slow response'
				},
				decidim: {
					status: HealthStatus.UNHEALTHY,
					timestamp: new Date().toISOString(),
					details: 'Service unavailable'
				}
			};

			const result = ServiceStatusesResponseSchema.safeParse(validStatuses);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(validStatuses);
			}
		});

		it('should validate empty service statuses', () => {
			const result = ServiceStatusesResponseSchema.safeParse({});
			expect(result.success).toBe(true);
		});
	});

	describe('KubernetesHealthResponseSchema', () => {
		it('should validate kubernetes health response', () => {
			const validK8sResponse = {
				healthy: true,
				details: {
					status: HealthStatus.HEALTHY,
					checks: {
						database: {
							status: HealthStatus.HEALTHY,
							timestamp: new Date().toISOString()
						}
					},
					timestamp: new Date().toISOString(),
					version: '2.0.0'
				}
			};

			const result = KubernetesHealthResponseSchema.safeParse(validK8sResponse);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(validK8sResponse);
			}
		});

		it('should validate unhealthy kubernetes response', () => {
			const unhealthyK8sResponse = {
				healthy: false,
				details: {
					status: HealthStatus.UNHEALTHY,
					checks: {
						database: {
							status: HealthStatus.UNHEALTHY,
							timestamp: new Date().toISOString(),
							details: 'Connection refused'
						}
					},
					timestamp: new Date().toISOString()
				}
			};

			const result = KubernetesHealthResponseSchema.safeParse(unhealthyK8sResponse);
			expect(result.success).toBe(true);
		});

		it('should fail validation without required fields', () => {
			const invalidK8sResponse = {
				healthy: true
			};

			const result = KubernetesHealthResponseSchema.safeParse(invalidK8sResponse);
			expect(result.success).toBe(false);
		});
	});
});
