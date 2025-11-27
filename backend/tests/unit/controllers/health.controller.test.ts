// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
import { FastifyReply, FastifyRequest } from 'fastify';

// Mock logger before importing anything else
jest.mock('../../../src/utils/logger', () => ({
	default: {
		info: jest.fn(),
		error: jest.fn()
	}
}));

// Mock BaseController.execute
const mockExecute = jest.fn();
jest.mock('../../../src/controllers/base/base.controller', () => ({
	BaseController: class {
		static execute = mockExecute;
	}
}));

import HealthController from '../../../src/controllers/health.controller';
import HealthService from '../../../src/services/health.service';

describe('HealthController', () => {
	let mockRequest: Partial<FastifyRequest>;
	let mockReply: Partial<FastifyReply>;

	beforeEach(() => {
		jest.clearAllMocks();
		mockExecute.mockResolvedValue(undefined);
		mockRequest = {
			id: 'test-request-id',
			method: 'GET',
			url: '/health'
		};
		mockReply = {
			send: jest.fn(),
			status: jest.fn().mockReturnThis()
		};
	});

	describe('health', () => {
		it('should call BaseController.execute with health service method', async () => {
			await HealthController.health(mockRequest as FastifyRequest<{}>, mockReply as FastifyReply);

			expect(mockExecute).toHaveBeenCalledWith({
				req: mockRequest,
				reply: mockReply,
				fnc: HealthService.health
			});
		});
	});

	describe('ready', () => {
		it('should call BaseController.execute with ready service method', async () => {
			await HealthController.ready(mockRequest as FastifyRequest<{}>, mockReply as FastifyReply);

			expect(mockExecute).toHaveBeenCalledWith({
				req: mockRequest,
				reply: mockReply,
				fnc: HealthService.ready
			});
		});
	});

	describe('live', () => {
		it('should call BaseController.execute with live service method', async () => {
			await HealthController.live(mockRequest as FastifyRequest<{}>, mockReply as FastifyReply);

			expect(mockExecute).toHaveBeenCalledWith({
				req: mockRequest,
				reply: mockReply,
				fnc: HealthService.live
			});
		});
	});

	describe('serviceStatuses', () => {
		it('should call BaseController.execute with getServiceStatuses method', async () => {
			await HealthController.serviceStatuses(mockRequest as FastifyRequest<{}>, mockReply as FastifyReply);

			expect(mockExecute).toHaveBeenCalledWith({
				req: mockRequest,
				reply: mockReply,
				fnc: HealthService.getServiceStatuses
			});
		});
	});

	describe('kubernetes', () => {
		it('should call BaseController.execute with getKubernetesHealthCheck method', async () => {
			await HealthController.kubernetes(mockRequest as FastifyRequest<{}>, mockReply as FastifyReply);

			expect(mockExecute).toHaveBeenCalledWith({
				req: mockRequest,
				reply: mockReply,
				fnc: HealthService.getKubernetesHealthCheck
			});
		});
	});
});
