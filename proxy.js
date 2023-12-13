const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use(
	createProxyMiddleware(['/auth', '/rest', '/realtime', '/storage', '/functions', '/analytics', '/pg'], {
		target: 'http://192.168.1.50:8000',
		changeOrigin: true,
		ws: true,
	})
);

// supabase studio
app.use(createProxyMiddleware(['/project', '/monaco-editor', '/css', '/_next', '/api', '/favicon', '/img'], { target: 'http://192.168.1.50:3000', changeOrigin: true, ws: true }));

app.use(createProxyMiddleware('/', { target: 'http://localhost:8443', changeOrigin: true, ws: true }));

app.listen(3000);
