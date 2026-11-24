import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { EDGE } from './config.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class Conn {
	constructor(ws) {
		this.ws = ws;
		this.id = 0;
		this.pending = new Map();
		this.handlers = [];
		ws.onmessage = (m) => this.#msg(JSON.parse(m.data));
	}
	#msg(d) {
		if (d.id) {
			const p = this.pending.get(d.id);
			if (!p) return;
			this.pending.delete(d.id);
			if (d.error) p.rej(new Error(p.method + ': ' + d.error.message));
			else p.res(d.result);
		} else for (const h of this.handlers) h(d);
	}
	send(method, params = {}, sessionId) {
		const id = ++this.id;
		return new Promise((res, rej) => {
			this.pending.set(id, { res, rej, method });
			this.ws.send(JSON.stringify({ id, method, params, sessionId }));
		});
	}
}

export async function launch({ port = 9333, dir, args = [] }) {
	const proc = spawn(
		EDGE,
		[
			'--headless=new',
			`--remote-debugging-port=${port}`,
			`--user-data-dir=${dir}`,
			'--no-first-run',
			'--no-default-browser-check',
			'--disable-extensions',
			'--disable-sync',
			'--hide-scrollbars',
			'--force-color-profile=srgb',
			'--disable-background-networking',
			'--disable-component-update',
			'--mute-audio',
			'--disable-renderer-backgrounding',
			'--disable-backgrounding-occluded-windows',
			// only the local instance is reachable: no analytics or other outside traffic while recording
			'--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE localhost , EXCLUDE 127.0.0.1',
			...args,
			'about:blank',
		],
		{ stdio: 'ignore' },
	);
	let info;
	for (let i = 0; i < 100; i++) {
		try {
			info = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
			break;
		} catch {
			await sleep(150);
		}
	}
	if (!info) throw new Error('browser did not start');
	const ws = new WebSocket(info.webSocketDebuggerUrl);
	await new Promise((r, j) => {
		ws.onopen = r;
		ws.onerror = j;
	});
	const conn = new Conn(ws);
	return {
		proc,
		conn,
		close: async () => {
			try {
				await Promise.race([conn.send('Browser.close'), sleep(2000)]);
			} catch {}
			proc.kill();
		},
	};
}

export async function newPage(conn, { width, height, dsf = 1, mobile = false, inject, routes = [] }) {
	const { browserContextId } = await conn.send('Target.createBrowserContext', {});
	const { targetId } = await conn.send('Target.createTarget', { url: 'about:blank', browserContextId });
	const { sessionId } = await conn.send('Target.attachToTarget', { targetId, flatten: true });
	const s = (m, p) => conn.send(m, p, sessionId);
	const page = { s, sessionId, width, height, inflight: new Map(), logs: [], lastNet: Date.now() };
	const cors = [
		{ name: 'access-control-allow-origin', value: '*' },
		{ name: 'access-control-allow-headers', value: '*' },
		{ name: 'access-control-allow-methods', value: '*' },
	];
	conn.handlers.push(async (d) => {
		if (d.sessionId !== sessionId) return;
		const p = d.params;
		if (d.method === 'Network.requestWillBeSent') {
			if (!/^(data|blob):/.test(p.request.url)) {
				page.inflight.set(p.requestId, p.request.url);
				page.lastNet = Date.now();
			}
		}
		if (d.method === 'Network.loadingFinished' || d.method === 'Network.loadingFailed') {
			page.inflight.delete(p.requestId);
			page.lastNet = Date.now();
		}
		if (d.method === 'Runtime.exceptionThrown') page.logs.push('EXC ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text).slice(0, 300));
		if (d.method === 'Runtime.consoleAPICalled' && p.type === 'error') page.logs.push('ERR ' + p.args.map((a) => a.value || a.description || '').join(' ').slice(0, 300));
		if (d.method === 'Fetch.requestPaused') {
			const url = p.request.url;
			const r = routes.find((r) => url.includes(r.match));
			if (r) {
				if (p.request.method !== 'OPTIONS' && r.before) await r.before();
				s('Fetch.fulfillRequest', {
					requestId: p.requestId,
					responseCode: 200,
					responseHeaders: [...cors, { name: 'content-type', value: 'application/json' }],
					body: Buffer.from(p.request.method === 'OPTIONS' ? '' : r.body).toString('base64'),
				}).catch(() => {});
			} else s('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
		}
	});
	await s('Page.enable');
	await s('Network.enable');
	await s('Runtime.enable');
	if (routes.length) await s('Fetch.enable', { patterns: routes.map((r) => ({ urlPattern: `*${r.match}*` })) });
	await s('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dsf, mobile });
	if (mobile) await s('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
	await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
	if (inject) await s('Page.addScriptToEvaluateOnNewDocument', { source: inject });
	page.eval = async (expr) => {
		const r = await s('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true, userGesture: true });
		if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text) + '\n' + expr.slice(0, 200));
		return r.result.value;
	};
	page.goto = async (url) => {
		await s('Page.navigate', { url });
		await sleep(400);
	};
	page.idle = async (quiet = 350, max = 15000) => {
		const t = Date.now();
		while (Date.now() - t < max) {
			const busy = [...page.inflight.values()].filter((u) => !/websocket|@vite|google/.test(u)).length;
			if (!busy && Date.now() - page.lastNet > quiet) break;
			await sleep(40);
		}
	};
	page.shot = async (opts = {}) => Buffer.from((await s('Page.captureScreenshot', { format: 'jpeg', quality: 93, optimizeForSpeed: true, ...opts })).data, 'base64');
	return page;
}

export { sleep, fs, path };
