import fp from 'fastify-plugin';
import { sequelize } from '../config/database';

export default fp(async fastify => {
	fastify.addHook('onClose', async () => {
		await sequelize.close();
	});
});
