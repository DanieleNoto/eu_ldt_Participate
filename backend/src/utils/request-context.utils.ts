import { requestContext, RequestContextData } from '@fastify/request-context';

export const getRequestContext: () => RequestContextData = (): RequestContextData =>
	requestContext.getStore() as RequestContextData;
