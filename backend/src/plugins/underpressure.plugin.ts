/* eslint-disable prefer-arrow/prefer-arrow-functions */
import upressure from '@fastify/under-pressure';
import fp from 'fastify-plugin';
import appConfig from '../config/config';

export default fp(async function (fastify, opts) {
	fastify.register(upressure, {
		maxEventLoopDelay: appConfig.underPressure.maxEventLoopDelay,
		maxHeapUsedBytes: appConfig.underPressure.maxHeapUsedBytes,
		maxRssBytes: appConfig.underPressure.maxRssBytes,
		maxEventLoopUtilization: appConfig.underPressure.maxEventLoopUtilization
	});
});
