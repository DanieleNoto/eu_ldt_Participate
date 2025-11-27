// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
import { encrypt, encrdecryptypt } from '../../../src/utils/cypher';
import appConfig from '../../../src/config/config';

describe('cypher utils', () => {
	const originalEnv = process.env;
	beforeEach(() => {
		jest.resetModules();
		process.env = { ...originalEnv, CYPHER_SECRET: 'testsecret', CYPHER_SALT: 'testsalt' };
	});
	afterAll(() => {
		process.env = originalEnv;
	});

	it('should encrypt and decrypt a string', async () => {
		// Patch config to use a known algorithm and separator
		(appConfig as any).cypher = { algorithm: 'aes-256-cbc', seperator: '::' };
		const text = 'hello world';
		const encrypted = await encrypt(text);
		expect(typeof encrypted).toBe('string');
		const decrypted = await encrdecryptypt(encrypted);
		expect(decrypted).toBe(text);
	});

	it('should throw if decrypting with wrong data', async () => {
		(appConfig as any).cypher = { algorithm: 'aes-256-cbc', seperator: '::' };
		await expect(encrdecryptypt('bad::data')).rejects.toThrow();
	});
});
