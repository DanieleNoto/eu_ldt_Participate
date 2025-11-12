/* eslint-disable */
const { config } = require('shakapacker');
const { InjectManifest } = require('workbox-webpack-plugin');
const { EsbuildPlugin } = require('esbuild-loader');

const isProduction = process.env.NODE_ENV === 'production';

const customConfig = {
	devServer: {
		hot: true,
		liveReload: false,
		devMiddleware: {
			publicPath: '/decidim-packs/',
			writeToDisk: filePath => {
				return /\.hot-update\.(json|js)$/.test(filePath);
			},
			headers: {
				'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
				Pragma: 'no-cache',
				Expires: '0'
			}
		},
		client: {
			webSocketURL: {
				hostname: 'localhost',
				port: 3000,
				pathname: '/decidim-packs/ws'
			},
			overlay: {
				errors: true,
				warnings: false
			}
		}
	},
	output: {
		publicPath: '/decidim-packs/'
	},
	module: {
		rules: [
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
	plugins: []
};

if (isProduction) {
	customConfig.plugins.push(
		new InjectManifest({
			swSrc: 'src/decidim/sw/sw.js',

			/**
			 * NOTE:
			 * @rails/webpacker outputs to '/packs',
			 * in order to make the SW run properly
			 * they must be put at the project's root folder '/'
			 */
			swDest: '../sw.js'
		})
	);
}

module.exports = customConfig;
