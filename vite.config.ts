import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [react(), tailwindcss()],
	// Keep CRA-era env var names working (.env files and Dockerfile ARGs are unchanged)
	envPrefix: ['VITE_', 'REACT_APP_'],
	server: {
		port: 3001,
		open: true,
		allowedHosts: ['localhost', '192.168.1.30', '4f28-174-49-173-205.ngrok-free.app'],
	},
	build: {
		// nginx Dockerfile copies /app/build — keep CRA's output path
		outDir: 'build',
	},
});
