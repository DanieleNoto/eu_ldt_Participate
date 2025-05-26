import * as dotenv from 'dotenv';
import { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import packageJson from '../../package.json';

dotenv.config();

export interface SwaggerConfig {
	info: {
		title: string;
		description: string;
		version: string;
	};
	servers: {
		url: string;
		description: string;
	}[];
	components: {
		securitySchemes?: {
			bearerAuth: {
				type: 'http';
				scheme: 'bearer';
				bearerFormat: 'JWT';
			};
		};
	};
	tags?: Array<{
		name: string;
		description?: string;
	}>;
	security?: Array<{
		[key: string]: string[];
	}>;
	exposeRoute: boolean;
}

const getSwaggerConfig: () => FastifyDynamicSwaggerOptions = () => {
	const config: FastifyDynamicSwaggerOptions = {
		swagger: {},
		openapi: {
			info: {
				title: 'EU LDT Participate Chatbot API',
				description: packageJson.description,
				version: packageJson.version
			},
			servers: [
				{
					url: 'http://localhost:3000',
					description: 'Development server'
				}
			]
			// exposeRoute: true
		},
		transform: jsonSchemaTransform
	};

	if (process.env.JWT_ENABLE_CHECK === 'true') {
		config.openapi = {
			...config.openapi,
			components: {
				securitySchemes: {
					bearerAuth: {
						type: 'http',
						scheme: 'bearer',
						bearerFormat: 'JWT'
					}
				}
			},
			security: [
				{
					bearerAuth: []
				}
			]
		};
	}

	return config;
};

export const swaggerConfig = getSwaggerConfig();
