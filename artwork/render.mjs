// Rebuilds every logo, icon and email image from the app's own GiftIcon (src/components/SvgIcons.tsx).
//
//   node artwork/render.mjs            everything
//   node artwork/render.mjs logos      favicons, app icons, wordmarks, default avatar
//   node artwork/render.mjs email      images used by the email templates in Giftamizer-Supabase
//
// Needs Node 22+, `npm install` (for the Inter font and the lucide icons) and Edge or Chrome.
// Set BROWSER to the browser's path if it isn't found.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ART = import.meta.dirname;
const APP = path.resolve(ART, '..');
const only = process.argv[2];

// ------------------------------------------------------------------ brand
const PRIMARY = '#059669'; // --primary in src/index.css
const FOREGROUND = '#09090b'; // --foreground

const GIFT = fs.readFileSync(path.join(APP, 'src/components/SvgIcons.tsx'), 'utf8').match(/function GiftIcon[\s\S]*?<path d='([^']+)'/)[1];
// the drawing fills 66.2..733.8 of its 800x800 viewBox, centered on 400,400
const GIFT_SIZE = 667.6;

const svg = (size, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">${body}</svg>\n`;

// the bare mark, as in the app header
const mark = (color) => svg(800, `<path fill="${color}" d="${GIFT}"/>`);

// white gift on an emerald tile: `scale` is the gift's share of the tile, `radius` the corner radius, both as a fraction of its width
const tile = ({ scale, radius = 0, color = PRIMARY }) => {
	const k = (512 * scale) / GIFT_SIZE;
	return svg(512, `${color ? `<rect width="512" height="512" rx="${512 * radius}" fill="${color}"/>` : ''}<path fill="#fff" transform="translate(256 256) scale(${k.toFixed(4)}) translate(-400 -400)" d="${GIFT}"/>`);
};

const APP_ICON = { scale: 0.64, radius: 0.22 };
const FULL_BLEED = { scale: 0.6 };
const MASKABLE = { scale: 0.52 }; // stays inside the 80% safe circle
const FAVICON = { scale: 0.76, radius: 0.22 }; // bigger gift so it reads at 16px

// ------------------------------------------------------------------ browser
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BROWSER = [
	process.env.BROWSER,
	'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
	'C:/Program Files/Google/Chrome/Application/chrome.exe',
	'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
	'/usr/bin/google-chrome',
	'/usr/bin/chromium',
].find((p) => p && fs.existsSync(p));
if (!BROWSER) throw new Error('No browser found. Set BROWSER to the path of Edge or Chrome.');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'giftamizer-artwork-'));
const browser = spawn(BROWSER, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', '--force-color-profile=srgb', 'about:blank'], { stdio: 'ignore' });

const portFile = path.join(profile, 'DevToolsActivePort');
for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await sleep(150);
await sleep(200);
const [port, wsPath] = fs.readFileSync(portFile, 'utf8').trim().split('\n');
const ws = new WebSocket(`ws://127.0.0.1:${port}${wsPath.trim()}`);
await new Promise((res, rej) => ((ws.onopen = res), (ws.onerror = rej)));

let lastId = 0;
const pending = new Map();
ws.onmessage = ({ data }) => {
	const m = JSON.parse(data);
	const p = pending.get(m.id);
	if (!p) return;
	pending.delete(m.id);
	m.error ? p.rej(new Error(m.error.message)) : p.res(m.result);
};
const send = (method, params = {}, sessionId) =>
	new Promise((res, rej) => {
		pending.set(++lastId, { res, rej });
		ws.send(JSON.stringify({ id: lastId, method, params, sessionId }));
	});

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const page = (method, params) => send(method, params, sessionId);
await page('Page.enable');
await page('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });

const inter = fs.readFileSync(path.join(APP, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')).toString('base64');
const BASE = `<style>
@font-face { font-family: Inter; src: url(data:font/woff2;base64,${inter}) format('woff2'); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { overflow: hidden; font-family: Inter, sans-serif; -webkit-font-smoothing: antialiased; }
svg { display: block; }
</style>`;

// renders HTML at width x height CSS pixels, dpr times larger in the PNG
async function shot(html, width, height, dpr = 1, options = { format: 'png' }) {
	await page('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dpr, mobile: false });
	const { frameTree } = await page('Page.getFrameTree');
	await page('Page.setDocumentContent', { frameId: frameTree.frame.id, html: `<!doctype html><html><head><meta charset="utf-8">${BASE}</head><body>${html}</body></html>` });
	await page('Runtime.evaluate', {
		expression: `Promise.all([400, 500, 600, 700, 800].map((w) => document.fonts.load(w + ' 20px Inter'))).then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))`,
		awaitPromise: true,
	});
	const { data } = await page('Page.captureScreenshot', options);
	return Buffer.from(data, 'base64');
}

const image = (source, width, height = width) => shot(source.replace('<svg ', `<svg width="${width}" height="${height}" `), width, height);

function save(file, data) {
	const out = path.join(APP, file);
	fs.mkdirSync(path.dirname(out), { recursive: true });
	fs.writeFileSync(out, data);
	console.log(file, `${(Buffer.byteLength(data) / 1024).toFixed(1)} KB`);
}

// ICO container around PNG images
function ico(images) {
	const head = Buffer.alloc(6 + images.length * 16);
	head.writeUInt16LE(1, 2);
	head.writeUInt16LE(images.length, 4);
	let offset = head.length;
	images.forEach(({ size, png }, i) => {
		const at = 6 + i * 16;
		head.writeUInt8(size % 256, at);
		head.writeUInt8(size % 256, at + 1);
		head.writeUInt16LE(1, at + 4);
		head.writeUInt16LE(32, at + 6);
		head.writeUInt32LE(png.length, at + 8);
		head.writeUInt32LE(offset, at + 12);
		offset += png.length;
	});
	return Buffer.concat([head, ...images.map((i) => i.png)]);
}

// ------------------------------------------------------------------ lucide icons, as used by the app
function lucide(name) {
	const dir = path.join(APP, 'node_modules/lucide-react/dist/esm/icons');
	const file = ['.mjs', '.js'].map((ext) => path.join(dir, name + ext)).find((f) => fs.existsSync(f));
	const src = fs.readFileSync(file, 'utf8');
	const start = src.indexOf('const __iconNode = ') + 19;
	const nodes = (0, eval)(`(${src.slice(start, src.indexOf('];', start) + 1)})`);
	const body = nodes.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('');
	return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

// ------------------------------------------------------------------ logos
// the app header's wordmark: icon and text in a 24:18 ratio, semibold, tracking -0.025em
const wordmark = (height, { icon, text, pad = 0 }) =>
	`<div id="logo" style="display:inline-flex;align-items:center;height:${height}px;gap:${height * 0.18}px;padding:${pad}px;white-space:nowrap;color:${text};font-size:${height * 0.82}px;font-weight:600;letter-spacing:-.025em;line-height:1">
		${mark(icon).replace('<svg ', `<svg width="${height}" height="${height}" style="margin:0 ${-height * 0.06}px" `)}<span>Giftamizer</span>
	</div>`;

if (!only || only === 'logos') {
	// masters
	save('artwork/logo/icon.svg', mark(PRIMARY));
	save('artwork/logo/icon-white.svg', mark('#ffffff'));
	save('artwork/logo/app-icon.svg', tile(APP_ICON));
	save('artwork/logo/app-icon-full-bleed.svg', tile(FULL_BLEED));
	save('artwork/logo/app-icon.png', await image(tile(APP_ICON), 1024));
	save('artwork/logo/logo.png', await shot(wordmark(200, { icon: PRIMARY, text: FOREGROUND }), 1080, 200));
	save('artwork/logo/logo-white.png', await shot(wordmark(200, { icon: '#ffffff', text: '#ffffff' }), 1080, 200));

	// browser tabs
	save('public/favicon.svg', tile(FAVICON));
	save('public/favicon-16x16.png', await image(tile(FAVICON), 16));
	save('public/favicon-32x32.png', await image(tile(FAVICON), 32));
	const sizes = [];
	for (const size of [16, 24, 32, 48, 64, 128, 256]) sizes.push({ size, png: await image(tile(size > 64 ? APP_ICON : FAVICON), size) });
	save('public/favicon.ico', ico(sizes));

	// installed app
	for (const size of [192, 512]) {
		const png = await image(tile(APP_ICON), size);
		save(`public/android-chrome-${size}x${size}.png`, png);
		save(`public/logo${size}.png`, png);
		save(`public/maskable-${size}x${size}.png`, await image(tile(MASKABLE), size));
	}
	save('public/apple-touch-icon.png', await image(tile(FULL_BLEED), 180));
	save('public/mstile-150x150.png', await image(tile({ scale: 0.4, color: null }), 270)); // white on the tile color in browserconfig.xml

	// in the app
	save('public/defaultAvatar.png', await image(tile({ scale: 0.54 }), 512)); // shown in a circle
	save('public/images/GiftamizerIcon.png', await image(tile(APP_ICON), 2048));
}

// ------------------------------------------------------------------ email images
if (!only || only === 'email') {
	// shown at half size, so they stay sharp on high density screens
	save('public/images/email/icon.png', await image(mark(PRIMARY), 96));
	save('public/images/email/giftamizer_logo.png', await shot(wordmark(56, { icon: PRIMARY, text: FOREGROUND }), 318, 56));
	save('artwork/email-logo.png', await shot(wordmark(56, { icon: PRIMARY, text: FOREGROUND }), 318, 56));

	// feature icons, as on the landing page: tinted 44px tile with a 20px icon
	for (const [file, name, color, tint] of [
		['feature-items', 'images', PRIMARY, '#e6f5f0'],
		['feature-login', 'log-in', '#0284c7', '#e7f6fd'],
		['feature-foundation', 'rocket', '#d97706', '#fef3e0'],
	]) {
		const html = `<div style="width:44px;height:44px;border-radius:16px;background:${tint};color:${color};display:flex;align-items:center;justify-content:center"><div style="width:20px;height:20px">${lucide(name)}</div></div>`;
		save(`public/images/email/${file}.png`, await shot(html, 44, 44, 2));
	}

	// above the heading of the auth emails, as on the app's sign in and password pages: white icon on an emerald disc
	for (const [file, name] of [
		['icon-lock', 'lock'],
		['icon-mail', 'mail'],
	]) {
		const html = `<div style="width:48px;height:48px;border-radius:50%;background:${PRIMARY};color:#fff;display:flex;align-items:center;justify-content:center"><div style="width:22px;height:22px">${lucide(name)}</div></div>`;
		save(`public/images/email/${file}.png`, await shot(html, 48, 48, 2));
	}

	const template = fs.readFileSync(path.join(ART, 'email-header.html'), 'utf8');
	for (const [variant, file] of [
		['invite', 'email-header'],
		['santa', 'email-header-secret-santa'],
	]) {
		const html = template
			.replaceAll('{{variant}}', variant)
			.replaceAll('{{gift}}', `<svg viewBox="0 0 800 800" fill="currentColor"><path d="${GIFT}"/></svg>`)
			.replace(/\{\{icon:([\w-]+)\}\}/g, (_, name) => lucide(name));
		const png = await shot(html, 600, 280, 2);
		save(`artwork/${file}.png`, png);
		save(`public/images/email/${file}.jpg`, await shot(html, 600, 280, 2, { format: 'jpeg', quality: 88 })); // a third of the PNG's size
		if (variant === 'invite') save(`public/images/email/${file}.png`, png); // address used before the JPEG
	}
}

try {
	await Promise.race([send('Browser.close'), sleep(2000)]);
} catch {}
browser.kill();
await sleep(500);
try {
	fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
} catch {}
process.exit(0);
