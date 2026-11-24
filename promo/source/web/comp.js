// Deterministic composition: window.render(t) draws the exact frame for time t (seconds).
const V = window.innerHeight > window.innerWidth; // vertical (9:16) or landscape (16:9)
const CW = window.innerWidth;
const CH = window.innerHeight;
const $ = (s) => document.querySelector(s);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const prog = (t, a, d) => clamp((t - a) / d);
const eo = (u) => 1 - (1 - u) ** 3;
const eo5 = (u) => 1 - (1 - u) ** 5;
const ei = (u) => u ** 3;
const eio = (u) => (u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2);
const back = (u, s = 1.7) => 1 + (s + 1) * (u - 1) ** 3 + s * (u - 1) ** 2;
const spring = (u, k = 5.2, f = 2.4) => 1 - Math.exp(-k * u) * Math.cos(f * Math.PI * u);
const rnd = (seed) => {
	let x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, u) => {
	const A = hex(a);
	const B = hex(b);
	return '#' + A.map((v, i) => Math.round(lerp(v, B[i], u)).toString(16).padStart(2, '0')).join('');
};

const DUR = 56;
window.DUR = DUR;
const C = { green: '#059669', greenD: '#047857', amber: '#d97706', rose: '#e11d48', sky: '#0284c7', ink: '#09090b' };
const GIFT_LID =
	'M314.6,155.9l45.4,77.2h-1.7h-93.9c-28.8,0-52.2-23.3-52.2-52.2s23.3-52.2,52.2-52.2h2.9 C286.7,128.8,304.8,139.1,314.6,155.9z M149.6,180.9c0,18.8,4.6,36.5,12.5,52.2h-54.2c-23.1,0-41.7,18.6-41.7,41.7v83.5 c0,23.1,18.6,41.7,41.7,41.7h584.2c23.1,0,41.7-18.6,41.7-41.7v-83.5c0-23.1-18.6-41.7-41.7-41.7h-54.2c8-15.6,12.5-33.4,12.5-52.2 c0-63.4-51.4-114.7-114.7-114.7h-2.9c-41.6,0-80.2,22-101.3,57.9L400,177.7l-31.4-53.5c-21.1-36-59.7-58-101.3-58h-2.9 C201,66.2,149.6,117.6,149.6,180.9z M587.8,180.9c0,28.8-23.3,52.2-52.2,52.2h-93.9H440l45.4-77.2c9.9-16.8,27.9-27.1,47.3-27.1h2.9 C564.4,128.8,587.8,152.1,587.8,180.9z';
const GIFT_BOX = 'M107.9,441.7v229.5c0,34.6,28,62.6,62.6,62.6h187.8V441.7H107.9z M441.7,733.8h187.8 c34.6,0,62.6-28,62.6-62.6V441.7H441.7V733.8z';
ICONS.giftamizer = `<svg viewBox="0 0 800 800" fill="currentColor"><path d="${GIFT_LID} ${GIFT_BOX}"/></svg>`;

// ------------------------------------------------------------------ timeline
// map: [scene seconds, clip frame] knots
const SC = [
	{ id: 'landing', at: 3, end: 5, clip: 'landing', map: [[0, 4], [0.7, 24], [2, 112]], bg: '#e7f7f0', ac: C.green, ic: 'sparkles', eb: 'Your personal gift registry', h: 'An easier way to| *organize your gifts.*' },
	{ id: 'items', at: 5, end: 7, clip: 'items', map: [[0, 16], [2, 142]], bg: '#e7f7f0', ac: C.green, ic: 'giftamizer', eb: 'Items', h: 'Your wishlist,| *in your pocket.*' },
	{ id: 'add', at: 7, end: 13, clip: 'add', map: [[0, 4], [0.55, 36], [1.05, 69], [1.95, 139], [3.3, 216], [3.9, 296], [4.6, 384], [6.0, 462]], bg: '#e7f7f0', ac: C.green, ic: 'sparkles', eb: 'Easily add gifts', h: 'Paste a link. *Done.*', sub: 'Name, photos and price fill in for you.',
		cam: [[0, 1, 195, 600], [0.9, 1, 195, 600], [1.35, 1.22, 195, 610], [1.9, 1.22, 195, 610], [2.5, 1.06, 195, 300], [4.5, 1.0, 195, 300], [5.1, 1.16, 195, 120], [6.0, 1.16, 195, 120]] },
	{ id: 'gallery', at: 13, end: 16, clip: 'gallery', map: [[0, 12], [0.9, 80], [2.0, 160], [3, 212]], bg: '#fdf1dc', ac: C.amber, ic: 'images', eb: 'Every detail', h: 'Exactly the *right one.*', sub: 'Photos, sizes, colors and store links.',
		cam: [[0, 1.08, 195, 200], [0.6, 1.08, 195, 200], [1.3, 1.14, 195, 390], [3, 1.16, 195, 390]] },
	{ id: 'lists', at: 16, end: 20, clip: 'lists', map: [[0, 20], [0.95, 72], [2.0, 136], [4, 236]], bg: '#e2f2fc', ac: C.sky, ic: 'clipboard-list', eb: 'Lists', h: 'A list for everyone.| *Even the kids.*',
		cam: [[0, 1, 195, 300], [0.5, 1, 195, 360], [0.9, 1.1, 195, 420], [1.8, 1.1, 195, 420], [2.4, 1, 195, 420], [4, 1, 195, 420]] },
	{ id: 'groups', at: 20, end: 23, clip: 'groups', map: [[0, 30], [0.5, 62], [1.05, 118], [3, 262]], bg: '#fde8ec', ac: C.rose, ic: 'users', eb: 'Groups', h: 'Share with the| *people you love.*' },
	{ id: 'invite', at: 23, end: 25, clip: 'invite', map: [[0, 10], [0.55, 60], [2, 160]], bg: '#fde8ec', ac: C.rose, ic: 'user-plus', eb: 'Invites', h: 'Invite by name,| *email or link.*',
		cam: [[0, 1, 195, 420], [0.7, 1, 195, 420], [1.3, 1.16, 195, 330], [2, 1.18, 195, 330]] },
	{ id: 'claim', at: 25, end: 29, clip: 'claim', map: [[0, 2], [0.9, 44], [2.35, 150], [4, 240]], bg: '#e7f7f0', ac: C.green, ic: 'list-checks', eb: 'Planning', h: 'Claim it.| *No duplicate gifts.*',
		cam: [[0, 1, 195, 400], [0.5, 1, 195, 400], [1.0, 1.28, 215, 420], [3.2, 1.3, 215, 420], [3.95, 1.0, 215, 420]] },
	{ id: 'privacy', at: 29, end: 33, duo: true, bg: '#e7f7f0', ac: C.green, ic: 'eye-off', eb: 'No spoilers', h: 'The surprise| *stays safe.*' },
	{ id: 'shopping', at: 33, end: 36, clip: 'shopping', map: [[0, 18], [1.35, 140], [1.8, 176], [3, 246]], bg: '#fdf1dc', ac: C.amber, ic: 'shopping-cart', eb: 'Shopping list', h: 'Your shopping list| *builds itself.*' },
	{ id: 'santa', at: 36, end: 44, clip: 'santa', map: [[0, 14], [1.0, 80], [1.6, 120], [2.1, 163], [3.1, 270], [3.6, 322], [4.7, 440], [5.3, 513], [5.75, 552], [8, 686]], bg: '#fde8ec', ac: C.rose, ic: 'shuffle', eb: 'Secret Santa', h: 'Secret Santa, *sorted.*', sub: 'Pick a date, set exclusions, draw names.', h2: 'Kids join in, *too.*', h2at: 6.0,
		cam: [[0, 1, 195, 200], [0.4, 1.1, 195, 190], [0.95, 1.1, 195, 190], [1.4, 1, 195, 300], [3.5, 1, 195, 300], [4.0, 1.14, 215, 280], [4.9, 1.14, 215, 280], [5.3, 1.0, 195, 400], [5.75, 1.0, 195, 200], [6.3, 1.2, 195, 190], [8, 1.22, 195, 190]] },
	{ id: 'feed', at: 44, end: 47, clip: 'feed', map: [[0, 26], [1.1, 126], [1.45, 178], [1.75, 205], [3, 305]], bg: '#e2f2fc', ac: C.sky, ic: 'newspaper', eb: 'Feed', h: 'Never miss *a change.*', sub: 'Filter it to what matters to you.',
		cam: [[0, 1, 195, 250], [0.2, 1.08, 195, 200], [1.1, 1.08, 195, 200], [1.6, 1, 195, 560], [2.2, 1.12, 195, 600], [3, 1.12, 195, 600]] },
	{ id: 'settings', at: 47, end: 50, clip: 'settings', map: [[0, 18], [1.45, 140], [3, 250]], bg: '#d5efe4', ac: C.green, ic: 'settings', eb: 'Settings', h: 'Make it *yours.*', sub: 'Archive, trash can, even snowfall.',
		cam: [[0, 1, 170, 250], [0.5, 1.22, 170, 230], [2.2, 1.22, 170, 230], [2.95, 1.0, 170, 230]] },
];
const INTRO_END = 3;
const OUTRO = 50;

// ------------------------------------------------------------------ assets
const clips = {};
const cache = new Map();
async function loadClips() {
	for (const n of ['landing', 'items', 'add', 'gallery', 'lists', 'groups', 'invite', 'claim', 'alice', 'ben', 'shopping', 'santa', 'feed', 'settings', 'snow']) clips[n] = await (await fetch(`/clips/${n}/clip.json`)).json();
}
function frameImg(clip, idx) {
	const c = clips[clip];
	const f = c.map[clamp(Math.round(idx), 0, c.frames - 1)];
	const key = clip + f;
	if (!cache.has(key)) {
		cache.set(
			key,
			fetch(`/clips/${clip}/${String(f).padStart(5, '0')}.jpg`)
				.then((r) => r.blob())
				.then((b) => createImageBitmap(b)),
		);
		if (cache.size > 14) {
			const k = cache.keys().next().value;
			cache.get(k).then((b) => b.close());
			cache.delete(k);
		}
	}
	return cache.get(key);
}
const mapFrame = (m, t) => {
	if (t <= m[0][0]) return m[0][1];
	for (let i = 1; i < m.length; i++) if (t <= m[i][0]) return lerp(m[i - 1][1], m[i][1], (t - m[i - 1][0]) / (m[i][0] - m[i - 1][0]));
	return m[m.length - 1][1];
};
// smooth keyframes [t, z, x, y]
const camAt = (k, t) => {
	if (!k) return [1, 195, 400];
	if (t <= k[0][0]) return k[0].slice(1);
	for (let i = 1; i < k.length; i++)
		if (t <= k[i][0]) {
			const u = eio((t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]));
			return [1, 2, 3].map((j) => lerp(k[i - 1][j], k[i][j], u));
		}
	return k[k.length - 1].slice(1);
};

// ------------------------------------------------------------------ phone
const PW = 390;
const PH = 844;
const STATUS = 44;
const APPH = 780;
const BZ = 13; // bezel in css units
class Phone {
	constructor(scale, res = 2.3) {
		this.s = scale;
		this.el = document.createElement('div');
		this.el.className = 'phone';
		const w = (PW + BZ * 2) * scale;
		const h = (PH + BZ * 2) * scale;
		this.w = w;
		this.h = h;
		Object.assign(this.el.style, { width: w + 'px', height: h + 'px' });
		this.el.innerHTML = `<div class="bezel" style="border-radius:${60 * scale}px"></div>
			<div class="screen" style="left:${BZ * scale}px;top:${BZ * scale}px;width:${PW * scale}px;height:${PH * scale}px;border-radius:${48 * scale}px"><canvas></canvas></div>
			<div class="island" style="left:${(BZ + PW / 2 - 52) * scale}px;top:${(BZ + 9) * scale}px;width:${104 * scale}px;height:${29 * scale}px"></div>
			<div class="homebar" style="left:${(BZ + PW / 2 - 64) * scale}px;top:${(BZ + PH - 9) * scale}px;width:${128 * scale}px;height:${4.6 * scale}px"></div>`;
		this.cv = this.el.querySelector('canvas');
		this.res = res;
		this.cv.width = Math.round(PW * res);
		this.cv.height = Math.round(PH * res);
		this.g = this.cv.getContext('2d', { alpha: false });
		this.g.imageSmoothingQuality = 'high';
		$('#stage').appendChild(this.el);
	}
	place(x, y, z = 1, rx = 0, ry = 0, rz = 0, op = 1, zi = 1) {
		this.el.style.transform = `translate3d(${x - this.w / 2}px,${y - this.h / 2}px,0) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${z})`;
		this.el.style.opacity = op;
		this.el.style.zIndex = zi;
		this.el.style.display = op <= 0 ? 'none' : '';
	}
	hide() {
		this.el.style.display = 'none';
	}
	// draw a clip frame filling the screen; dx shifts horizontally for push transitions (css units)
	async draw(clip, idx, dx = 0, dim = 0) {
		const img = await frameImg(clip, idx);
		const g = this.g;
		const r = this.res;
		const W = PW * r;
		g.save();
		g.translate(dx * r, 0);
		// status bar + home area pick up the page's own edge colors
		g.drawImage(img, 4, 4, 1, 1, 0, 0, W, STATUS * r + 1);
		g.drawImage(img, 4, img.height - 5, 1, 1, 0, (STATUS + APPH) * r - 1, W, (PH - STATUS - APPH) * r + 2);
		g.drawImage(img, 0, STATUS * r, W, APPH * r);
		if (dim > 0) {
			g.fillStyle = `rgba(0,0,0,${dim})`;
			g.fillRect(0, 0, W, PH * r);
		}
		g.restore();
	}
	status() {
		const g = this.g;
		const r = this.res;
		g.save();
		g.scale(r, r);
		g.fillStyle = '#09090b';
		g.font = '600 15.5px Inter';
		g.textBaseline = 'middle';
		g.textAlign = 'center';
		g.fillText('9:41', 56, 25);
		// signal
		for (let i = 0; i < 4; i++) {
			g.beginPath();
			g.roundRect(304 + i * 4.8, 29 - (3.6 + i * 2.5), 3.2, 3.6 + i * 2.5, 1);
			g.fill();
		}
		// battery
		g.globalAlpha = 0.4;
		g.lineWidth = 1;
		g.strokeStyle = '#09090b';
		g.beginPath();
		g.roundRect(331, 18.5, 23, 11.5, 3.6);
		g.stroke();
		g.globalAlpha = 1;
		g.beginPath();
		g.roundRect(332.8, 20.3, 17.5, 7.9, 2.1);
		g.fill();
		g.beginPath();
		g.roundRect(355.4, 22.2, 1.6, 4, 0.8);
		g.globalAlpha = 0.5;
		g.fill();
		g.restore();
	}
	taps(clip, idx, dx = 0) {
		const g = this.g;
		const r = this.res;
		for (const e of clips[clip].events) {
			if (e.x == null) continue;
			const pre = e.pre * 0.06;
			const hold = e.press * 0.06;
			const a = idx - e.f; // frames since start of the gesture
			if (a < 0 || a > pre + hold + 22) continue;
			const inn = clamp(a / Math.min(pre, 9));
			const press = clamp((a - pre + 3) / 4) * (1 - clamp((a - pre - hold) / 6));
			const out = clamp((a - pre - hold) / 10);
			g.save();
			g.translate((e.x + dx) * r, (e.y + STATUS) * r);
			const rip = clamp((a - pre) / 22);
			if (rip > 0 && rip < 1) {
				g.beginPath();
				g.arc(0, 0, lerp(16, 46, eo(rip)) * r, 0, 7);
				g.strokeStyle = `rgba(5,150,105,${0.65 * (1 - rip)})`;
				g.lineWidth = 3 * r;
				g.stroke();
			}
			g.globalAlpha = eo(inn) * (1 - out);
			g.beginPath();
			g.arc(0, 0, lerp(26, 18, eo(inn)) * lerp(1, 0.78, press) * r, 0, 7);
			g.fillStyle = `rgba(9,9,11,${lerp(0.28, 0.46, press)})`;
			g.fill();
			g.lineWidth = 2.2 * r;
			g.strokeStyle = 'rgba(255,255,255,.95)';
			g.stroke();
			g.restore();
		}
	}
}

// ------------------------------------------------------------------ layout
const L = V
	? { s: 1.66, px: CW / 2, py: 1152, capX: 70, capY: 84, capW: CW - 140, h: 84, eb: 31, sub: 38, align: 'left' }
	: { s: 1.135, px: 1390, py: CH / 2, capX: 130, capY: 0, capW: 880, h: 84, eb: 30, sub: 38, align: 'left' };

let main;
let left;
let right;
const caps = [];
const tags = {};

function buildCaps() {
	const mk = (sc, text, withMeta) => {
		const el = document.createElement('div');
		el.className = 'cap';
		Object.assign(el.style, { left: L.capX + 'px', width: L.capW + 'px' });
		if (V) el.style.top = L.capY + 'px';
		else Object.assign(el.style, { top: 0, height: '100%', justifyContent: 'center' });
		let on = false;
		let html = '';
		for (const tok of text.split(/([*|])/)) {
			if (tok === '*') on = !on;
			else if (tok === '|') html += '<br>';
			else for (const w of tok.split(/( +)/)) html += w.trim() ? `<span class="w" style="${on ? `color:${sc.ac}` : ''}">${w}</span>` : w ? ' ' : '';
		}
		el.innerHTML = `<div class="eyebrow" style="font-size:${L.eb}px;padding:.5em 1em .5em .8em;margin-bottom:${V ? 24 : 34}px;color:${sc.ac};background:${sc.ac}1c;box-shadow:0 0 0 2px ${sc.ac}33 inset">${ICONS[sc.ic]}<span>${sc.eb}</span></div>
			<div class="h" style="font-size:${L.h}px">${html}</div>
			${withMeta && sc.sub ? `<div class="sub" style="font-size:${L.sub}px;margin-top:${V ? 18 : 26}px">${sc.sub}</div>` : ''}`;
		$('#caps').appendChild(el);
		return { el, eb: el.querySelector('.eyebrow'), ws: [...el.querySelectorAll('.w')], sub: el.querySelector('.sub') };
	};
	for (const sc of SC) {
		const end = sc.h2at ? sc.at + sc.h2at : sc.end;
		caps.push({ ...mk(sc, sc.h, true), a: sc.at, b: end });
		if (sc.h2) caps.push({ ...mk(sc, sc.h2, false), a: sc.at + sc.h2at, b: sc.end, keepEb: true });
	}
}
function drawCaps(t) {
	caps.forEach((c, i) => {
		const on = t >= c.a - 0.05 && t < c.b + 0.02;
		c.el.style.display = on ? '' : 'none';
		if (!on) return;
		const a = t - c.a;
		const out = ei(prog(t, c.b - 0.24, 0.24));
		const e0 = c.keepEb ? 1 : eo5(prog(a, 0.04, 0.5));
		const sameEbNext = caps[i + 1]?.keepEb && Math.abs(caps[i + 1].a - c.b) < 0.01;
		c.eb.style.opacity = e0 * (sameEbNext ? 1 : 1 - out);
		c.eb.style.transform = `translateY(${(1 - e0) * 24 - (sameEbNext ? 0 : out * 26)}px) scale(${lerp(0.86, 1, e0)})`;
		c.eb.style.transformOrigin = 'left center';
		c.ws.forEach((w, k) => {
			const u = eo5(prog(a, 0.1 + k * 0.06, 0.62));
			w.style.opacity = clamp(u * 1.4) * (1 - out);
			w.style.transform = `translateY(${(1 - u) * 56 - out * 30}px) rotate(${(1 - u) * 3}deg)`;
			w.style.filter = u < 0.98 ? `blur(${(1 - u) * 8}px)` : '';
		});
		if (c.sub) {
			const u = eo5(prog(a, 0.42, 0.6));
			c.sub.style.opacity = u * (1 - out);
			c.sub.style.transform = `translateY(${(1 - u) * 26 - out * 22}px)`;
		}
	});
}

// ------------------------------------------------------------------ background
const bgc = $('#bg');
const sn = $('#snow');
const fx = $('#fx');
for (const c of [bgc, sn, fx]) {
	c.width = CW;
	c.height = CH;
}
const bg = bgc.getContext('2d');
const sg = sn.getContext('2d');
const fg = fx.getContext('2d');
const bgKeys = [
	[0, '#059669', '#04a777', 1],
	[2.55, '#059669', '#04a777', 1],
	...SC.map((s) => [s.at, s.bg, s.ac, 0]),
	[OUTRO, '#059669', '#04a777', 1],
];
function drawBg(t) {
	let i = 0;
	while (i + 1 < bgKeys.length && t >= bgKeys[i + 1][0]) i++;
	const cur = bgKeys[i];
	const prev = bgKeys[Math.max(0, i - 1)];
	const u = i ? eio(prog(t, cur[0], 0.7)) : 1;
	const light = mix(prev[1], cur[1], u);
	const ac = mix(prev[2], cur[2], u);
	const g = bg.createLinearGradient(0, 0, 0, CH);
	const dark = lerp(prev[3], cur[3], u);
	g.addColorStop(0, light);
	g.addColorStop(1, dark > 0.5 ? '#065f46' : mix(light, '#ffffff', 0.72));
	bg.fillStyle = dark > 0.02 && dark < 0.98 ? light : g;
	bg.fillRect(0, 0, CW, CH);
	if (dark > 0.02 && dark < 0.98) {
		bg.globalAlpha = 1 - dark;
		const g2 = bg.createLinearGradient(0, 0, 0, CH);
		g2.addColorStop(0, light);
		g2.addColorStop(1, mix(light, '#ffffff', 0.72));
		bg.fillStyle = g2;
		bg.fillRect(0, 0, CW, CH);
		bg.globalAlpha = 1;
	}
	// soft drifting blobs
	for (let k = 0; k < 4; k++) {
		const x = CW * (0.5 + 0.55 * Math.sin(t * 0.22 + k * 1.9));
		const y = CH * (0.5 + 0.46 * Math.cos(t * 0.17 + k * 2.3));
		const R = Math.max(CW, CH) * (0.28 + 0.08 * Math.sin(k * 4 + t * 0.3));
		const rg = bg.createRadialGradient(x, y, 0, x, y, R);
		const a = dark > 0.5 ? 0.16 : 0.13;
		const [r, gg, b] = hex(dark > 0.5 ? (k % 2 ? '#34d399' : '#10b981') : k === 3 ? '#f59e0b' : ac);
		rg.addColorStop(0, `rgba(${r},${gg},${b},${k === 3 && dark < 0.5 ? a * 0.7 : a})`);
		rg.addColorStop(1, `rgba(${r},${gg},${b},0)`);
		bg.fillStyle = rg;
		bg.fillRect(0, 0, CW, CH);
	}
}
function drawSnow(t) {
	sg.clearRect(0, 0, CW, CH);
	const a = prog(t, 48.4, 1.0);
	if (a <= 0) return;
	const N = V ? 130 : 150;
	for (let i = 0; i < N; i++) {
		const sp = lerp(70, 190, rnd(i + 1));
		const r = lerp(2, 6.5, rnd(i + 2.3));
		const y = ((rnd(i + 7.7) * (CH + 80) + t * sp) % (CH + 80)) - 40;
		const x = rnd(i + 3.1) * CW + Math.sin(t * lerp(0.4, 1.2, rnd(i + 9)) + i) * 34;
		sg.globalAlpha = a * lerp(0.35, 0.95, rnd(i + 5.5));
		sg.fillStyle = '#fff';
		sg.beginPath();
		sg.arc(x, y, r, 0, 7);
		sg.fill();
	}
	sg.globalAlpha = 1;
}
const CONF = ['#059669', '#34d399', '#f59e0b', '#fbbf24', '#e11d48', '#fb7185', '#0284c7', '#ffffff'];
function burst(t, t0, x, y, n, spd, seed) {
	const a = t - t0;
	if (a < 0 || a > 2.2) return;
	for (let i = 0; i < n; i++) {
		const an = lerp(-Math.PI * 1.06, Math.PI * 0.06, rnd(seed + i));
		const v = spd * lerp(0.45, 1.15, rnd(seed + i + 0.3));
		const k = 1.5;
		const d = (1 - Math.exp(-k * a)) / k;
		const px = x + Math.cos(an) * v * d;
		const py = y + Math.sin(an) * v * d + 520 * a * a * 0.8;
		const s = lerp(9, 19, rnd(seed + i + 0.6));
		fg.save();
		fg.globalAlpha = 1 - ei(prog(a, 1.2, 1.0));
		fg.translate(px, py);
		fg.rotate(a * lerp(-8, 8, rnd(seed + i + 0.8)) + i);
		fg.scale(1, Math.cos(a * lerp(6, 14, rnd(seed + i + 0.1)) + i));
		fg.fillStyle = CONF[i % CONF.length];
		if (i % 3 === 0) {
			fg.beginPath();
			fg.arc(0, 0, s * 0.45, 0, 7);
			fg.fill();
		} else fg.fillRect(-s / 2, -s * 0.28, s, s * 0.56);
		fg.restore();
	}
}

// ------------------------------------------------------------------ floating callouts
function mkTag(id, html, fs, pad = '.55em 1em .55em .75em') {
	const d = document.createElement('div');
	d.className = 'tag';
	d.style.fontSize = fs + 'px';
	d.style.padding = pad;
	d.innerHTML = html;
	$('#tags').appendChild(d);
	tags[id] = d;
}
function tag(id, t, a, b, x, y, o = {}) {
	const d = tags[id];
	const on = t >= a && t < b;
	d.style.display = on ? '' : 'none';
	if (!on) return;
	const u = clamp(spring(prog(t, a, 0.8), 6, 1.6), 0, 1.3);
	const out = ei(prog(t, b - 0.2, 0.2));
	const fl = Math.sin(t * 2.2 + x) * 4;
	d.style.left = x + 'px';
	d.style.top = y + 'px';
	d.style.opacity = clamp(prog(t, a, 0.15) * 1.2) * (1 - out);
	d.style.transform = `translate(-50%,-50%) translateY(${fl - out * 20}px) scale(${lerp(0.4, 1, u) * (1 - out * 0.15) * (o.z ?? 1)}) rotate(${o.r || 0}deg)`;
}

// ------------------------------------------------------------------ logo (intro/outro)
function buildLogo() {
	$('#logo').innerHTML = `
		<svg class="mark" viewBox="0 0 800 800" style="overflow:visible"><g class="lid"><path d="${GIFT_LID}" fill="#fff"/></g><g class="box"><path d="${GIFT_BOX}" fill="#fff"/></g></svg>
		<div class="word">Giftamizer</div>
		<div class="line"></div>
		<div class="cta"></div>`;
}
function drawLogo(t) {
	const root = $('#logo');
	const intro = t < INTRO_END + 0.1;
	const outro = t >= OUTRO;
	root.style.display = intro || outro ? '' : 'none';
	if (!intro && !outro) return;
	const mark = root.querySelector('.mark');
	const lid = root.querySelector('.lid');
	const word = root.querySelector('.word');
	const line = root.querySelector('.line');
	const cta = root.querySelector('.cta');
	const cx = CW / 2;
	let cy;
	let size;
	let a;
	if (intro) {
		a = t;
		size = V ? 330 : 280;
		cy = V ? CH * 0.4 : CH * 0.38;
		const u = spring(prog(a, 0.02, 1.0), 6, 2.0);
		const open = back(eo(prog(a, 0.5, 0.35))) * (1 - eio(prog(a, 1.35, 0.35)));
		const squash = 1 - 0.1 * Math.sin(Math.PI * prog(a, 0.38, 0.2));
		const out = eio(prog(a, 2.55, 0.45));
		mark.style.width = mark.style.height = size + 'px';
		mark.style.left = cx - size / 2 + 'px';
		mark.style.top = cy - size / 2 + 'px';
		mark.style.transform = `translateY(${(1 - u) * -520 - out * 190}px) scale(${(2 - squash) * lerp(1, 0.6, out)},${squash * lerp(1, 0.6, out)})`;
		mark.style.transformOrigin = '50% 92%';
		mark.style.opacity = 1 - out;
		lid.setAttribute('transform', `translate(${open * 30} ${-open * 150}) rotate(${open * 13} 400 320)`);
		const w = eo5(prog(a, 0.95, 0.6));
		word.style.fontSize = (V ? 150 : 150) + 'px';
		word.style.top = cy + size * 0.62 + 'px';
		word.style.opacity = w * (1 - out);
		word.style.transform = `translateY(${(1 - w) * 70 - out * 120}px)`;
		const l = eo5(prog(a, 1.4, 0.6));
		line.style.fontSize = '46px';
		line.style.top = cy + size * 0.62 + 200 + 'px';
		line.textContent = 'Giving just got a whole lot better.';
		line.style.opacity = l * (1 - out);
		line.style.transform = `translateY(${(1 - l) * 40 - out * 90}px)`;
		cta.style.display = 'none';
	} else {
		a = t - OUTRO;
		size = V ? 210 : 170;
		const x0 = V ? cx : CW * 0.3;
		cy = V ? 250 : 300;
		const u = spring(prog(a, 0.1, 1.0), 6, 1.8);
		const open = back(eo(prog(a, 0.8, 0.3))) * (1 - eio(prog(a, 1.5, 0.35)));
		mark.style.width = mark.style.height = size + 'px';
		mark.style.left = x0 - size / 2 + 'px';
		mark.style.top = cy - size / 2 + 'px';
		mark.style.transform = `scale(${clamp(u, 0, 2)})`;
		mark.style.transformOrigin = '50% 60%';
		mark.style.opacity = prog(a, 0.1, 0.15);
		lid.setAttribute('transform', `translate(${open * 30} ${-open * 130}) rotate(${open * 13} 400 320)`);
		const w = eo5(prog(a, 0.35, 0.6));
		word.style.fontSize = (V ? 128 : 120) + 'px';
		word.style.width = line.style.width = V ? '100%' : CW * 0.6 + 'px';
		word.style.top = cy + size * 0.56 + 'px';
		word.style.opacity = w;
		word.style.transform = `translateY(${(1 - w) * 60}px)`;
		const l = eo5(prog(a, 0.7, 0.6));
		line.style.fontSize = (V ? 46 : 42) + 'px';
		line.style.top = cy + size * 0.56 + (V ? 168 : 160) + 'px';
		line.textContent = 'Wish. Share. Give. No duplicates.';
		line.style.opacity = l;
		line.style.transform = `translateY(${(1 - l) * 40}px)`;
		const c = spring(prog(a, 1.1, 0.9), 6, 1.6);
		cta.style.display = '';
		cta.style.fontSize = (V ? 50 : 46) + 'px';
		cta.style.padding = '.62em 1.15em';
		cta.style.left = x0 + 'px';
		cta.style.top = cy + size * 0.56 + (V ? 278 : 268) + 'px';
		cta.innerHTML = 'Get started at giftamizer.com';
		cta.style.opacity = prog(a, 1.1, 0.12);
		const pulse = 1 + 0.02 * Math.sin(Math.max(0, a - 2) * Math.PI * 2) * (a > 2 ? 1 : 0);
		cta.style.transform = `translateX(-50%) scale(${lerp(0.5, 1, c) * pulse})`;
	}
}

// ------------------------------------------------------------------ setup
async function init() {
	await document.fonts.load('800 40px Inter');
	await document.fonts.load('600 16px Inter');
	await loadClips();
	left = new Phone(L.s);
	right = new Phone(L.s);
	main = new Phone(L.s);
	buildCaps();
	buildLogo();
	const fs = V ? 38 : 32;
	mkTag('t1', `<span style="color:${C.green};display:flex">${ICONS['link-2']}</span>thesill.com/snake-plant`, fs);
	mkTag('t2', `<span style="color:${C.green};display:flex">${ICONS.check}</span>Name`, fs);
	mkTag('t3', `<span style="color:${C.green};display:flex">${ICONS.check}</span>Photos`, fs);
	mkTag('t4', `<span style="color:${C.green};display:flex">${ICONS.check}</span>Price`, fs);
	mkTag('d1', `<img src="/seed/people/alice.jpg" style="width:1.9em;height:1.9em">Alice sees it's taken`, V ? 36 : 30, '.4em .9em .4em .4em');
	mkTag('d2', `<img src="/seed/people/ben.jpg" style="width:1.9em;height:1.9em">Ben sees nothing`, V ? 36 : 30, '.4em .9em .4em .4em');
	mkTag('k1', `<img src="/seed/people/lily.jpg" style="width:1.9em;height:1.9em">Lily's list`, V ? 38 : 32, '.4em .9em .4em .4em');
	await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
	await render(0);
	window.READY = true;
}

const sceneAt = (t) => {
	for (let i = SC.length - 1; i >= 0; i--) if (t >= SC[i].at) return i;
	return -1;
};

async function drawScene(ph, sc, t, dx = 0) {
	const lt = t - sc.at;
	const idx = mapFrame(sc.map, lt);
	await ph.draw(sc.clip, idx, dx);
	return idx;
}

const sway = (t) => [Math.cos(t * 0.65) * 1.1, Math.sin(t * 0.8) * 1.6, 1 + 0.012 * Math.sin(t * 0.9)];

async function render(t) {
	drawBg(t);
	drawSnow(t);
	fg.clearRect(0, 0, CW, CH);
	drawCaps(t);
	const i = sceneAt(t);
	const sc = SC[i];
	const stage = $('#stage');

	// ---- phones
	if (t >= OUTRO) {
		const a = t - OUTRO;
		const rise = (d) => spring(prog(a, d, 1.1), 5, 1.2);
		const z = V ? 0.93 : 0.86;
		const bx = V ? CW / 2 : CW * 0.745;
		const by = V ? 1540 : CH * 0.56;
		const spread = V ? 350 : 255;
		const bob = Math.sin(a * 1.5) * 8;
		const u0 = rise(0.0);
		const u1 = rise(0.35);
		const leftIdx = 620;
		const op = eo5(prog(a, 0, 0.55));
		const last = SC[SC.length - 1];
		if (op < 1) {
			await drawScene(main, last, t, -op * PW * 0.35);
			main.g.fillStyle = `rgba(0,0,0,${0.12 * op})`;
			main.g.fillRect(0, 0, main.cv.width, main.cv.height);
		}
		await main.draw('snow', clamp(a * 46, 0, 240), (1 - op) * PW);
		main.status();
		await left.draw('santa', leftIdx);
		left.status();
		await right.draw('shopping', 20 + clamp((a - 0.8) * 40, 0, 110));
		right.status();
		// the main phone glides from its scene position into the fan
		const g = eio(prog(a, 0, 0.8));
		const [swx, swy, swz] = sway(t);
		main.place(lerp(L.px, bx, g), lerp(L.py, by, g) + bob * g, lerp(swz, z, g), swx * (1 - g), swy * (1 - g), 0, 1, 3);
		left.place(lerp(bx, bx - spread, u1), by + lerp(260, 64, u1) - bob * 0.6, z * 0.88, 0, 0, lerp(0, -8, u1), prog(a, 0.35, 0.2), 1);
		right.place(lerp(bx, bx + spread, u1), by + lerp(260, 64, u1) + bob * 0.5, z * 0.88, 0, 0, lerp(0, 8, u1), prog(a, 0.35, 0.2), 1);
		stage.style.maskImage = stage.style.webkitMaskImage = 'none';
	} else if (sc) {
		const prev = SC[i - 1];
		const lt = t - sc.at;
		const push = i === 0 ? 1 : eo5(prog(lt, 0, 0.55));
		if (sc.duo) {
			// two people's phones, same item
			const u = spring(prog(lt, 0.22, 1.0), 5.2, 1.2);
			const z = V ? 0.745 : 0.86;
			const xA = V ? CW * 0.262 : CW * 0.585;
			const xB = V ? CW * 0.738 : CW * 0.83;
			const yy = V ? 1150 : CH * 0.56;
			await left.draw('alice', 12);
			left.status();
			await right.draw('ben', 12);
			right.status();
			const hl = async (ph, box, color, lab) => {
				const g = ph.g;
				const r = ph.res;
				const p = eo(prog(lt, 1.0, 0.5));
				if (p <= 0) return;
				const pul = 1 + 0.5 * Math.sin(lt * 5);
				g.save();
				g.lineWidth = (3 + pul) * r;
				g.strokeStyle = color;
				g.globalAlpha = p;
				g.beginPath();
				const m = lerp(26, 5, p);
				g.roundRect((box[0] - m) * r, (box[1] + STATUS - m) * r, (box[2] + 2 * m) * r, (box[3] + 2 * m) * r, 18 * r);
				g.stroke();
				g.restore();
			};
			await hl(left, clips.alice.box || [16, 134, 358, 203], 'rgba(220,38,38,.9)');
			await hl(right, clips.ben.box || [16, 96, 358, 203], 'rgba(5,150,105,.9)');
			// the main phone drops away and uncovers the two behind it; on the way out it rises back in front
			const m = ei(prog(lt, 0, 0.62));
			const drop = ei(prog(t, sc.end - 0.5, 0.5));
			const rise = eo(prog(t, sc.end - 0.42, 0.42));
			if (m < 1) {
				await main.draw('claim', 243);
				main.status();
				const [swx, swy, swz] = sway(t);
				main.place(L.px, L.py + m * CH * 1.1, lerp(1, 0.94, m) * swz, swx + m * -14, swy, 0, 1, 6);
			} else if (rise > 0) {
				const nx = SC[i + 1];
				await main.draw(nx.clip, nx.map[0][1]);
				main.status();
				const [swx, swy, swz] = sway(t);
				main.place(L.px, L.py + (1 - rise) * CH * 1.05, swz, swx + (1 - rise) * 16, swy, 0, 1, 6);
			} else main.hide();
			left.place(lerp(L.px, xA, u), yy + drop * CH * 1.1, z, 0, lerp(0, V ? 5 : 4, u), lerp(0, -1.5, u), 1, 2);
			right.place(lerp(L.px, xB, u), yy + drop * CH * 1.1, z, 0, lerp(0, V ? -5 : -4, u), lerp(0, 1.5, u), 1, 2);
			stage.style.maskImage = stage.style.webkitMaskImage = 'none';
		} else {
			left.hide();
			right.hide();
			const pushing = prev && !prev.duo && push < 1;
			if (pushing) {
				await drawScene(main, prev, t, -push * PW * 0.35);
				main.g.fillStyle = `rgba(0,0,0,${0.12 * push})`;
				main.g.fillRect(0, 0, main.cv.width, main.cv.height);
				// soft edge shadow ahead of the incoming screen
				const ex = (1 - push) * PW * main.res;
				const sh = main.g.createLinearGradient(ex - 40 * main.res, 0, ex, 0);
				sh.addColorStop(0, 'rgba(0,0,0,0)');
				sh.addColorStop(1, 'rgba(0,0,0,.18)');
				main.g.fillStyle = sh;
				main.g.fillRect(ex - 40 * main.res, 0, 40 * main.res, main.cv.height);
			}
			const dx = pushing ? (1 - push) * PW : 0;
			const idx = await drawScene(main, sc, t, dx);
			main.taps(sc.clip, idx, dx);
			main.status();

			// camera
			let [z, fxx, fyy] = camAt(sc.cam, lt);
			if (prev && !prev.duo && lt < 0.45) {
				const pc = camAt(prev.cam, prev.end - prev.at);
				const u = eio(prog(lt, 0, 0.45));
				z = lerp(pc[0], z, u);
				fxx = lerp(pc[1], fxx, u);
				fyy = lerp(pc[2], fyy, u);
			}
			z *= 1 + 0.012 * Math.sin(t * 0.9);
			const s = L.s;
			let ox = -(z - 1) * s * (fxx - PW / 2);
			let oy = -(z - 1) * s * (fyy + STATUS - PH / 2);
			let ry = Math.sin(t * 0.8) * 1.6;
			let rx = Math.cos(t * 0.65) * 1.1;
			let rz = 0;
			let y = L.py;
			let x = L.px;
			let op = 1;
			// swing on scene change
			if (i > 0 && !prev?.duo) {
				const k = Math.sin(Math.PI * eo(prog(lt, 0, 0.6)));
				ry += (i % 2 ? -1 : 1) * 9 * k;
				rz += (i % 2 ? 1 : -1) * 0.8 * k;
			}
			if (i === 0) {
				// first entrance
				const u = spring(prog(lt, -0.0, 1.1), 5.2, 1.1);
				y += (1 - u) * 900;
				rx += (1 - u) * 24;
			}
			main.place(x + ox, y + oy, z, rx, ry, rz, op, 3);
			if (V) {
				const m = clamp((z - 1.02) / 0.06);
				const y0 = lerp(-120, 395, m);
				stage.style.maskImage = stage.style.webkitMaskImage = m > 0 ? `linear-gradient(to bottom, transparent ${y0}px, #000 ${y0 + 70}px)` : 'none';
			} else stage.style.maskImage = stage.style.webkitMaskImage = 'none';
		}
	} else {
		main.hide();
		left.hide();
		right.hide();
		stage.style.maskImage = stage.style.webkitMaskImage = 'none';
	}

	// ---- floating callouts
	const A = SC.find((s) => s.id === 'add').at;
	const right0 = V ? CW - 190 : 1668;
	const left0 = V ? 205 : 1110;
	{
		const d = ei(prog(t, A + 1.2, 0.22));
		tag('t1', t, A + 0.55, A + 1.42, V ? CW / 2 : 1390, lerp(V ? 1010 : 470, V ? 1330 : 640, d), { z: 1 - d * 0.55 });
	}
	tag('t2', t, A + 2.1, A + 3.7, left0 - (V ? 30 : 20), V ? 1270 : 600, { r: -4 });
	tag('t3', t, A + 2.25, A + 3.7, right0 + (V ? 20 : 10), V ? 830 : 330, { r: 4 });
	tag('t4', t, A + 2.4, A + 3.7, right0 + (V ? 20 : 10), V ? 1590 : 800, { r: -3 });
	const P = SC.find((s) => s.id === 'privacy').at;
	tag('d1', t, P + 0.8, P + 3.6, V ? CW * 0.265 : CW * 0.585, V ? 505 : 92);
	tag('d2', t, P + 1.0, P + 3.6, V ? CW * 0.735 : CW * 0.83, V ? 505 : 92);
	const K = SC.find((s) => s.id === 'lists').at;
	tag('k1', t, K + 1.65, K + 3.75, V ? CW - 200 : 1660, V ? 575 : 120, { r: 4 });

	// ---- logo + confetti
	drawLogo(t);
	burst(t, 0.62, CW / 2, V ? CH * 0.4 - 60 : CH * 0.38 - 50, 90, 1500, 11);
	const S = SC.find((s) => s.id === 'santa').at;
	burst(t, S + 5.9, L.px, V ? 700 : 240, 80, 1250, 77);
	burst(t, OUTRO + 0.92, V ? CW / 2 : CW * 0.3, V ? 200 : 250, 80, 1300, 150);
	return true;
}
window.render = render;
// times of every on-screen press and cut, so the sound can be placed from the same source
window.cues = () => {
	const inv = (m, f) => {
		for (let i = 1; i < m.length; i++) if (f >= m[i - 1][1] && f <= m[i][1]) return lerp(m[i - 1][0], m[i][0], (f - m[i - 1][1]) / (m[i][1] - m[i - 1][1]));
		return null;
	};
	const out = [];
	for (const s of SC) {
		out.push({ t: s.at, k: 'cut', id: s.id });
		if (!s.clip) continue;
		for (const e of clips[s.clip].events) {
			if (e.x == null) continue;
			const u = inv(s.map, e.f + e.pre * 0.06 + 2);
			if (u != null && s.at + u < s.end) out.push({ t: s.at + u, k: 'tap' });
		}
	}
	return { dur: DUR, outro: OUTRO, cues: out };
};
init();
