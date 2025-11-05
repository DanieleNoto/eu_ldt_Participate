import { z } from 'zod';

export const HealthIdSchema = z.object({
	// id: z.string().uuid('Invalid UUID')
});

export const HealthRequestSchema = z.object({
	// name: z.string().min(3, 'Name must have at least 3 characters'),
	// email: z.string().email('Invalid email format'),
	// password: z.string().min(6, 'Password must have at least 6 characters')
});

export const HealthCheckSchema = z.object({
	status: z.string(),
	timestamp: z.string(),
	responseTime: z.number().optional(),
	details: z.string().optional()
});

export const HealthResponseSchema = z.object({
	status: z.string(),
	checks: z.record(z.string(), HealthCheckSchema),
	timestamp: z.string(),
	version: z.string().optional()
});

export const ServiceStatusesResponseSchema = z.record(z.string(), HealthCheckSchema);

export const KubernetesHealthResponseSchema = z.object({
	healthy: z.boolean(),
	details: HealthResponseSchema
});

// Type inference for TypeScript
export type HealthIdType = z.infer<typeof HealthIdSchema>;
export type HealthRequestType = z.infer<typeof HealthRequestSchema>;
export type HealthResponseType = z.infer<typeof HealthResponseSchema>;
export type HealthCheckType = z.infer<typeof HealthCheckSchema>;
export type ServiceStatusesResponseType = z.infer<typeof ServiceStatusesResponseSchema>;
export type KubernetesHealthResponseType = z.infer<typeof KubernetesHealthResponseSchema>;
