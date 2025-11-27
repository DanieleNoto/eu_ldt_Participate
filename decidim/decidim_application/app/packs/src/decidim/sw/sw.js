// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Gianfranco Cedro
/* eslint-disable no-console */
/* global self, caches, importScripts, workbox */

// Service Worker for Decidim application
// This file is processed by Workbox InjectManifest plugin

// Import Workbox from local node_modules instead of CDN
// This avoids GDPR issues and improves reliability
importScripts('/decidim-packs/js/workbox-sw.js');

if (workbox) {
	// Enable skipWaiting and clientsClaim for immediate activation
	workbox.core.skipWaiting();
	workbox.core.clientsClaim();

	// Set cache name prefix with dynamic versioning for better cache invalidation
	// Using timestamp as version to ensure cache refresh on new deployments
	const cacheVersion = self.__CACHE_VERSION__ || 'v1';
	workbox.core.setCacheNameDetails({
		prefix: 'decidim',
		suffix: cacheVersion
	});

	// Precache manifest will be injected here by InjectManifest plugin
	// This is where Workbox will inject the precache manifest
	workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

	// Cache images with StaleWhileRevalidate strategy
	// This ensures users see cached images immediately but get updates on next load
	workbox.routing.registerRoute(
		({ request }) => request.destination === 'image',
		new workbox.strategies.StaleWhileRevalidate({
			cacheName: 'decidim-images',
			plugins: [
				new workbox.expiration.ExpirationPlugin({
					maxEntries: 100,
					maxAgeSeconds: 7 * 24 * 60 * 60 // 7 Days (reduced from 30)
				})
			]
		})
	);

	// Cache CSS and JS files with a stale-while-revalidate strategy
	workbox.routing.registerRoute(
		({ request }) => request.destination === 'style' || request.destination === 'script',
		new workbox.strategies.StaleWhileRevalidate({
			cacheName: 'decidim-assets'
		})
	);

	// Cache fonts with a cache-first strategy
	workbox.routing.registerRoute(
		({ request }) => request.destination === 'font',
		new workbox.strategies.CacheFirst({
			cacheName: 'decidim-fonts',
			plugins: [
				new workbox.expiration.ExpirationPlugin({
					maxEntries: 30,
					maxAgeSeconds: 60 * 24 * 60 * 60 // 60 Days
				})
			]
		})
	);

	// Service Worker registered successfully
	// Log only in development for debugging
	if (typeof __DEV__ !== 'undefined' && __DEV__) {
		console.log('[SW] Service Worker registered successfully with version:', cacheVersion);
	}
} else {
	// Workbox failed to load - log error for monitoring
	console.error('[SW] Workbox could not be loaded. Offline functionality disabled.');
}
