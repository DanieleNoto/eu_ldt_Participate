import { FastifyReply, FastifyRequest } from 'fastify';
import HealthService from '../services/health.service';
import { BaseController } from './base/base.controller';

class HealthController extends BaseController {
	protected service = HealthService;

	async health(req: FastifyRequest<{}>, reply: FastifyReply) {
		await BaseController.execute({
			req,
			reply,
			fnc: this.service.health
		});
	}

	async ready(req: FastifyRequest<{}>, reply: FastifyReply) {
		await BaseController.execute({
			req,
			reply,
			fnc: this.service.ready
		});
	}

	async live(req: FastifyRequest<{}>, reply: FastifyReply) {
		await BaseController.execute({
			req,
			reply,
			fnc: this.service.live
		});
	}
}

export default new HealthController();
