import { routeSchemas } from './registered-routes';
import { setupTestServer, teardownTestServer, runCrudTests } from './crud.routes.base';

beforeAll(async () => {
	await setupTestServer();
});

afterAll(async () => {
	await teardownTestServer();
});

describe('Run routes tests', () => {
	describe('Simple CRUD', () => runCrudTests(routeSchemas));
});
