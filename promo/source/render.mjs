// node render.mjs h|v thumb                   -> promo/youtube-thumbnail.jpg (1920x1080) | youtube-short-cover.jpg (1080x1920)
// node render.mjs h banner | watermark | icon -> promo/youtube-banner.jpg (2560x1440) | youtube-watermark.png (600x600, transparent) | youtube-icon.png (800x800)
// node render.mjs v cues                      -> WORK/cues.json (every tap and cut, for the soundtrack)
// node render.mjs v|h still 0.5 1 2 ...      -> WORK/stills
// node render.mjs v|h video out.mp4 [fps]     -> silent video
import http from 'node:http';
import { spawn } from 'node:child_process';
import { launch, newPage, fs, path, sleep } from './cdp.mjs';
import { APP, FFMPEG, OUT, SRC, SUPA, WORK } from './config.mjs';

// the app's own icons (lucide) as inline SVG
function icons() {
	const dir = path.join(APP, 'node_modules/lucide-react/dist/esm/icons');
	const out = {};
	for (const n of ['sparkles', 'users', 'clipboard-list', 'shopping-cart', 'shuffle', 'list-checks', 'newspaper', 'settings', 'images', 'user-plus', 'eye-off', 'link-2', 'check']) {
		const src = fs.readFileSync(path.join(dir, n + (fs.existsSync(path.join(dir, n + '.mjs')) ? '.mjs' : '.js')), 'utf8');
		const a = src.indexOf('const __iconNode = ') + 19;
		const node = (0, eval)('(' + src.slice(a, src.indexOf('];', a) + 1) + ')');
		out[n] = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + node.map(([t, at]) => '<' + t + ' ' + Object.entries(at).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ') + '/>').join('') + '</svg>';
	}
	return 'window.ICONS=' + JSON.stringify(out) + ';';
}
const ICONS = icons();
const [layout, mode, ...rest] = process.argv.slice(2);
const [W, H] = mode === 'banner' ? [2560, 1440] : mode === 'watermark' ? [600, 600] : mode === 'icon' ? [800, 800] : layout === 'v' ? [1080, 1920] : [1920, 1080];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.png': 'image/png' };
const srv = http
	.createServer((q, r) => {
		const u = decodeURIComponent(q.url.split('?')[0]);
		if (u === '/icons.js') {
			r.writeHead(200, { 'content-type': 'text/javascript' });
			return r.end(ICONS);
		}
		const f = u.startsWith('/clips/')
			? path.join(WORK, u)
			: u.startsWith('/seed/')
				? path.join(SUPA, 'dev/seed-images', u.slice(5))
				: u === '/inter.woff2'
					? path.join(APP, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')
					: path.join(SRC, 'web', u === '/' ? 'index.html' : u);
		fs.readFile(f, (e, d) => {
			if (e) {
				r.writeHead(404);
				return r.end();
			}
			r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
			r.end(d);
		});
	})
	.listen(0);
const port = srv.address().port;
const B = await launch({ dir: path.join(WORK, '.edge-render-' + layout), port: layout === 'v' ? 9401 : 9402 });
const mk = async (page = '') => {
	const p = await newPage(B.conn, { width: W, height: H, dsf: 1 });
	await p.goto(`http://localhost:${port}/${page}`);
	for (let i = 0; i < 200; i++) {
		if (await p.eval('!!window.READY')) break;
		await sleep(100);
	}
	if (!(await p.eval('!!window.READY'))) {
		console.log('not ready', p.logs);
		process.exit(1);
	}
	return p;
};

if (mode === 'thumb') {
	const p = await mk('thumb.html');
	const out = path.join(OUT, layout === 'v' ? 'youtube-short-cover.jpg' : 'youtube-thumbnail.jpg');
	fs.writeFileSync(out, await p.shot({ quality: 92 }));
	console.log(out, (fs.statSync(out).size / 1e6).toFixed(2) + ' MB', p.logs);
} else if (mode === 'banner') {
	const p = await mk('banner.html');
	const out = path.join(OUT, 'youtube-banner.jpg');
	fs.writeFileSync(out, await p.shot({ quality: 92 }));
	console.log(out, (fs.statSync(out).size / 1e6).toFixed(2) + ' MB', p.logs);
} else if (mode === 'watermark') {
	const p = await mk('watermark.html');
	await p.s('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
	const out = path.join(OUT, 'youtube-watermark.png');
	fs.writeFileSync(out, await p.shot({ format: 'png', quality: undefined, optimizeForSpeed: false }));
	console.log(out, (fs.statSync(out).size / 1e3).toFixed(0) + ' KB', p.logs);
} else if (mode === 'icon') {
	const p = await mk('icon.html');
	const out = path.join(OUT, 'youtube-icon.png');
	fs.writeFileSync(out, await p.shot({ format: 'png', quality: undefined, optimizeForSpeed: false }));
	console.log(out, (fs.statSync(out).size / 1e3).toFixed(0) + ' KB', p.logs);
} else if (mode === 'cues') {
	const p = await mk();
	fs.writeFileSync(path.join(WORK, 'cues.json'), JSON.stringify(await p.eval('cues()'), null, 1));
} else if (mode === 'still') {
	const p = await mk();
	fs.mkdirSync(path.join(WORK, 'stills'), { recursive: true });
	for (const t of rest.map(Number)) {
		await p.eval(`render(${t})`);
		fs.writeFileSync(path.join(WORK, 'stills', `${layout}-${t.toFixed(2).padStart(5, '0')}.jpg`), await p.shot({ quality: 90 }));
	}
	console.log(p.logs.slice(0, 5));
} else {
	const [out, fpsS = '60', from = '0', to] = rest;
	const fps = +fpsS;
	const p0 = await mk();
	const DUR = to ? +to : await p0.eval('DUR');
	const N = Math.round((DUR - +from) * fps);
	const K = 4;
	const pages = [p0];
	for (let i = 1; i < K; i++) pages.push(await mk());
	const ff = spawn(FFMPEG, ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-', '-vf', 'scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'high', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
	const buf = new Map();
	let next = 0;
	const t0 = Date.now();
	const CH = 30; // each page renders runs of consecutive frames so clip decoding stays cached
	let chunk = 0;
	const flush = async () => {
		while (buf.has(next)) {
			const b = buf.get(next);
			buf.delete(next);
			next++;
			if (!ff.stdin.write(b)) await new Promise((r) => ff.stdin.once('drain', r));
			if (next % 300 === 0) console.log(next, '/', N, ((Date.now() - t0) / 1000).toFixed(0) + 's');
		}
	};
	let lock = Promise.resolve();
	await Promise.all(
		pages.map(async (p) => {
			for (;;) {
				const c = chunk++;
				if (c * CH >= N) break;
				for (let i = c * CH; i < Math.min(N, (c + 1) * CH); i++) {
					await p.eval(`render(${+from + i / fps})`);
					buf.set(i, await p.shot({ quality: 97 }));
				}
				lock = lock.then(flush);
				await lock;
			}
		}),
	);
	await lock;
	await flush();
	ff.stdin.end();
	await new Promise((r) => ff.on('close', r));
	console.log('done', next, 'frames', ((Date.now() - t0) / 1000).toFixed(0) + 's', pages.flatMap((p) => p.logs).slice(0, 5));
}
await B.close();
srv.close();
process.exit(0);
