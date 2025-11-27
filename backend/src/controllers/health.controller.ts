// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Pierluigi Spedicato
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

	async serviceStatuses(req: FastifyRequest<{}>, reply: FastifyReply) {
		await BaseController.execute({
			req,
			reply,
			fnc: this.service.getServiceStatuses
		});
	}

	async kubernetes(req: FastifyRequest<{}>, reply: FastifyReply) {
		await BaseController.execute({
			req,
			reply,
			fnc: this.service.getKubernetesHealthCheck
		});
	}
}

export default new HealthController();
