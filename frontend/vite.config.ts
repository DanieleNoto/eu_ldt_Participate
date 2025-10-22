import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [react(), tailwindcss()],
	publicDir: 'public', // Explicitly set public directory (Vite should copy this to dist)
	build: {
		target: 'esnext',
		modulePreload: false,
		minify: 'esbuild',
		cssCodeSplit: false,
		emptyOutDir: true,
		copyPublicDir: true, // Explicitly enable copying public directory
		rollupOptions: {
			output: {
				format: 'es',
				// For standalone chatbot, we need predictable filenames for the loader
				entryFileNames: 'index.js',
				chunkFileNames: '[name]-[hash].js',
				// Ensure CSS is extracted to a predictable filename
				assetFileNames: assetInfo => {
					if (assetInfo.name === 'style.css' || assetInfo.name?.endsWith('.css')) {
						return 'global.css';
					}
					return '[name]-[hash].[ext]';
				}
			}
		}
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
		host: '0.0.0.0',
		origin: 'http://localhost:5001',
		fs: {
			// Allow serving files from dist folder
			allow: ['..']
		},
		proxy: {
			'/api/v1': {
				target: process.env.VITE_API_URL || 'http://backend:3002',
				changeOrigin: true,
				secure: false
			}
		}
	},
	preview: {
		port: 5001,
		host: '0.0.0.0'
	}
});
