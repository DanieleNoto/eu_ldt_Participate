// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Pierluigi Spedicato
import fp from 'fastify-plugin';
import { sequelize } from '../config/database';

export default fp(async fastify => {
	fastify.addHook('onClose', async () => {
		await sequelize.close();
	});
});
