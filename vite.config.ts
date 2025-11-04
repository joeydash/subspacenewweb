import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: 'autoUpdate',
			workbox: {
				maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB
			},
			includeAssets: ['favicon.svg'],
			manifest: {
				name: 'Subspace',
				short_name: 'subspace',
				description:
					'Welcome to Subspace, your one-stop solution for getting discounts and saving money on subscriptions.',
				theme_color: '#ffffff',
				icons: [
					{
						src: 'subspace-192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: 'subspace-512.png',
						sizes: '512x512',
						type: 'image/png',
					},
				],
			},
		}),
	],
	optimizeDeps: {
		exclude: ['lucide-react'],
	},
	server: {
		proxy: {
			'/api': {
				target: 'https://api.superflow.run',
				changeOrigin: true,
				secure: true,
				rewrite: (path) => path.replace(/^\/api/, ''),
			},
		},
	},
})
