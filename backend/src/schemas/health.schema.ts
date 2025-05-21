import { z } from 'zod';

export const HealthIdSchema = z.object({
	// id: z.string().uuid('Invalid UUID')
});

export const HealthRequestSchema = z.object({
	// name: z.string().min(3, 'Name must have at least 3 characters'),
	// email: z.string().email('Invalid email format'),
	// password: z.string().min(6, 'Password must have at least 6 characters')
});

export const HealthResponseSchema = HealthRequestSchema.extend({
	status: z.string(),
	checks: z.object({
		database: z.string(),
		external_api: z.string(),
		internal_component: z.string()
	})
});

// Type inference for TypeScript
export type HealthIdType = z.infer<typeof HealthIdSchema>;
export type HealthRequestType = z.infer<typeof HealthRequestSchema>;
export type HealthResponseType = z.infer<typeof HealthResponseSchema>;
