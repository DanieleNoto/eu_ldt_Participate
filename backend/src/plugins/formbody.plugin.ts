/* eslint-disable prefer-arrow/prefer-arrow-functions */
import formbody from '@fastify/formbody';
import fp from 'fastify-plugin';

export default fp(async function (fastify, opts) {
	fastify.register(formbody);

	// fastify.addContentTypeParser('application/json', { bodyLimit: 0 }, (req, payload, done) => {
	// 	if (!payload || payload.length === 0) {
	// 		// Se il corpo è vuoto, restituisci un valore neutrale (es. `null` o `{}`)
	// 		return done(null, null); // Oppure `done(null, {})` per un oggetto vuoto
	// 	}
	//
	// 	// Altrimenti usa il comportamento standard per analizzare JSON
	// 	try {
	// 		const parsed = JSON.parse(payload.toString());
	// 		done(null, parsed);
	// 	} catch (err) {
	// 		done(err, undefined);
	// 	}
	// });
});
