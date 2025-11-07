/* eslint-disable no-console */
/* global self, caches, importScripts, workbox */

// Service Worker for Decidim application
// This file is processed by Workbox InjectManifest plugin

// Import Workbox from the CDN or local source
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
	console.log('Workbox is loaded');

	// Enable skipWaiting and clientsClaim for immediate activation
	workbox.core.skipWaiting();
	workbox.core.clientsClaim();

	// Set cache name prefix
	workbox.core.setCacheNameDetails({
		prefix: 'decidim',
		suffix: 'v1'
	});

	// Precache manifest will be injected here by InjectManifest plugin
	// This is where Workbox will inject the precache manifest
	workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

	// Cache images with a cache-first strategy
	workbox.routing.registerRoute(
		({ request }) => request.destination === 'image',
		new workbox.strategies.CacheFirst({
			cacheName: 'decidim-images',
			plugins: [
				new workbox.expiration.ExpirationPlugin({
					maxEntries: 60,
					maxAgeSeconds: 30 * 24 * 60 * 60 // 30 Days
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

	console.log('Service Worker registered successfully');
} else {
	console.log('Workbox could not be loaded. No offline support');
}
