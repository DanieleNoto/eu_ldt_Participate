import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Simple Vite config without Module Federation for testing
export default defineConfig({
	plugins: [react()],
	build: {
		target: 'esnext',
		lib: {
			entry: path.resolve(__dirname, 'src/app/standalone-chatbot.tsx'),
			name: 'EUChatbot',
			fileName: 'eu-chatbot',
			formats: ['es', 'umd']
		},
		rollupOptions: {
			external: ['react', 'react-dom'],
			output: {
				globals: {
					react: 'React',
					'react-dom': 'ReactDOM'
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
		proxy: {
			'/api/v1': {
				target: 'http://localhost:3000',
				changeOrigin: true,
				secure: false
			}
		}
	}
});
