// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Gianfranco Cedro
//   # Marco Pinnella
/* eslint-disable */
const { config } = require('shakapacker');
const { InjectManifest } = require('workbox-webpack-plugin');
const { EsbuildPlugin } = require('esbuild-loader');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

const customConfig = {
	devServer: {
		devMiddleware: {
			writeToDisk: true
		}
	},
	output: {
		publicPath: '/decidim-packs/'
	},
	module: {
		rules: [
			// Essential expose-loaders from Decidim core
			{
				test: require.resolve('jquery'),
				loader: 'expose-loader',
				options: {
					exposes: ['$', 'jQuery']
				}
			},
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules\//,
				loader: 'esbuild-loader'
			},
			{
				test: /\.(graphql|gql)$/,
				loader: 'graphql-tag/loader'
			},
			{
				test: require.resolve('react'),
				loader: 'expose-loader',
				options: {
					exposes: ['React']
				}
			},
			{
				test: require.resolve('@rails/ujs'),
				loader: 'expose-loader',
				options: {
					exposes: ['Rails']
				}
			},
			{
				test: [/\.md$/, /\.odt$/],
				exclude: [/\.(js|mjs|jsx|ts|tsx)$/],
				type: 'asset/resource',
				generator: {
					filename: 'media/documents/[hash][ext][query]'
				}
			},
			// Overwrite webpacker files rule to amend the filename output
			// and include the name of the file, otherwise some SVGs
			// are not generated because the hash is the same between them
			{
				test: [
					/\.bmp$/,
					/\.gif$/,
					/\.jpe?g$/,
					/\.png$/,
					/\.tiff$/,
					/\.ico$/,
					/\.avif$/,
					/\.webp$/,
					/\.eot$/,
					/\.otf$/,
					/\.ttf$/,
					/\.woff$/,
					/\.woff2$/,
					/\.svg$/
				],
				exclude: [/\.(js|mjs|jsx|ts|tsx)$/],
				type: 'asset/resource',
				generator: {
					filename: 'media/images/[name]-[hash][ext][query]'
				}
			}
		]
	},
	resolve: {
		extensions: ['.js', '.jsx', '.gql', '.graphql'],
		fallback: {
			crypto: false
		}
	},
	optimization: {
		moduleIds: 'deterministic',
		chunkIds: 'deterministic',
		minimizer: [
			new EsbuildPlugin({
				target: 'es2015',
				css: true
			})
		]
	},
	entry: config.entrypoints,
	plugins: [
		// Copy Workbox library from node_modules to output directory
		// This avoids CDN dependency and GDPR concerns
		new CopyPlugin({
			patterns: [
				{
					from: path.resolve(__dirname, '../../node_modules/workbox-sw/build/workbox-sw.js'),
					to: 'js/workbox-sw.js'
				}
			]
		})
	]
};

if (isProduction) {
	// Generate cache version based on build timestamp for cache invalidation
	const cacheVersion = `v${Date.now()}`;

	customConfig.plugins.push(
		new InjectManifest({
			swSrc: 'src/decidim/sw/sw.js',

			/**
			 * NOTE:
			 * @rails/webpacker outputs to '/packs',
			 * in order to make the SW run properly
			 * they must be put at the project's root folder '/'
			 */
			swDest: '../sw.js',

			// Inject cache version for dynamic cache invalidation
			injectionPoint: 'self.__WB_MANIFEST',

			// Maximum file size to precache (5MB)
			maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,

			// Exclude files from precaching to prevent issues
			exclude: [/\.map$/, /manifest\.json$/, /\.LICENSE\.txt$/],

			// Don't cache bust URLs that already have a hash
			dontCacheBustURLsMatching: /\.[0-9a-f]{8}\./
		})
	);

	// Define cache version as a global variable in the service worker
	customConfig.plugins.push(
		new (require('webpack').DefinePlugin)({
			'self.__CACHE_VERSION__': JSON.stringify(cacheVersion),
			__DEV__: false
		})
	);
}

module.exports = customConfig;
