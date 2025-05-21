import { z } from 'zod';

export interface Search {
	field: string;
	query: string[];
	not?: boolean;
}

export interface Sort {
	field: string;
	direction: 'ASC' | 'asc' | 'DESC' | 'desc';
}

/**
 * Standard success response schema with a message.
 */
export const SuccessMessageSchema = z.object({
	message: z.string({ message: 'Operation executed successfully' })
});

/**
 * Standard error response schema.
 * Includes error message, status code, and optional details.
 */
export const ErrorResponseSchema = z.object({
	statusCode: z.number(),
	error: z.string(),
	details: z.array(z.any()).optional() // Optional array for additional error details
});

// Type definitions
export type SuccessMessageType = z.infer<typeof SuccessMessageSchema>;
export type ErrorResponseType = z.infer<typeof ErrorResponseSchema>;
