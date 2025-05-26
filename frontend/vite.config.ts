import { federation } from '@module-federation/vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
// eslint-disable-next-line import/order
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		federation({
			filename: 'remoteEntry.js',
			name: 'remote',
			exposes: {
				'./remote-routes': './src/app/RemoteRoot.tsx'
			},
			remotes: {},
			shared: {
				react: {
					singleton: true
				},
				'react-dom': {
					singleton: true
				},
				'react-router': {
					singleton: true
				}
			}
		})
	],
	build: {
		target: 'esnext',
		modulePreload: false,
		minify: false,
		assetsDir: ''
	},
	resolve: {
		alias: {
			'@app': path.resolve(__dirname, './src/app/'),
			'@config': path.resolve(__dirname, './src/config/'),
			'@core': path.resolve(__dirname, './src/app/core/'),
			'@logger': path.resolve(__dirname, './src/app/logger/'),
			'@pages': path.resolve(__dirname, './src/app/pages/'),
			'@theme': path.resolve(__dirname, './src/app/theme/'),
			'@src': path.resolve(__dirname, './src/'),
			'@shared': path.resolve(__dirname, './src/app/shared/'),
			'@utils': path.resolve(__dirname, './src/app/utils/')
		}
	},
	server: {
		port: 5001,
		proxy: {
			'/api/v1': {
				target: 'http://localhost:3000',
				changeOrigin: true,
				secure: false
			}
		}
	}
});
