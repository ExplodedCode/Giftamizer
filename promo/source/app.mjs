import { launch, newPage, sleep, fs, path } from './cdp.mjs';
import { BASE, CAST, SRC, WORK, session } from './config.mjs';

export const W = 390;
export const H = 780;
export const DSF = 3;
export const FPS = 60;
const inject = fs.readFileSync(path.join(SRC, 'inject.js'), 'utf8');

let B;
export async function browser() {
	B ??= await launch({ dir: path.join(WORK, '.edge'), port: 9333 });
	return B;
}
export async function done() {
	await B?.close();
}

export async function openAs(who, { routes = [], url = `${BASE}/items`, wait = 1500 } = {}) {
	const b = await browser();
	const page = await newPage(b.conn, { width: W, height: H, dsf: DSF, mobile: true, inject, routes: [{ match: '/functions/v1/invite', body: '"ok"' }, ...routes] });
	if (who) {
		const ses = await session(CAST[who]);
		await page.goto(`${BASE}/robots.txt`);
		await page.eval(`localStorage.setItem('sb-localhost-auth-token', ${JSON.stringify(JSON.stringify(ses))}); localStorage.setItem('giftamizer-theme','light')`);
	}
	await page.goto(url);
	await page.idle(800);
	await page.eval(`new Promise(r=>setTimeout(r,${wait}))`);
	await page.idle(400);
	return page;
}

// Light mode only, and no dev-only elements. If the app's markup changes and one shows up again, stop instead of recording it.
export async function assertClean(page) {
	const bad = await page.eval(`(()=>{const out=[];if(document.documentElement.classList.contains('dark'))out.push('dark mode');
		const vis=e=>{const b=e.getBoundingClientRect();return b.width>0&&b.height>0&&getComputedStyle(e).visibility!=='hidden'};
		for(const e of document.querySelectorAll('button,header *'))if(vis(e)){const t=(e.innerText||'').trim().toLowerCase();if(t==='switch user'||t==='dev')out.push('visible: '+t)}
		return out})()`);
	if (bad.length) throw new Error('not recording, fix the selectors in inject.js: ' + [...new Set(bad)].join(', '));
}

export class Clip {
	constructor(page, name) {
		this.page = page;
		this.name = name;
		this.dir = path.join(WORK, 'clips', name);
		this.events = [];
		this.map = [];
		this.n = 0;
		this.marks = {};
		fs.rmSync(this.dir, { recursive: true, force: true });
		fs.mkdirSync(this.dir, { recursive: true });
	}
	async start() {
		await assertClean(this.page);
		await this.page.eval('__vt.on(); __vt.flush()');
		await this.settle();
		await this.grab(true);
		return this;
	}
	get t() {
		return this.map.length / FPS;
	}
	mark(k) {
		this.marks[k] = this.map.length;
	}
	async grab(force) {
		if (force || this.force || !this.n) {
			const buf = await this.page.shot();
			this.n++;
			fs.writeFileSync(path.join(this.dir, String(this.n).padStart(5, '0') + '.jpg'), buf);
		}
		this.map.push(this.n);
	}
	async frame() {
		const st = await this.page.eval(`__vt.step(${1000 / FPS})`);
		if (st.busy) this.tail = 3;
		await this.grab(this.tail-- > 0);
	}
	async hold(ms) {
		const k = Math.round((ms / 1000) * FPS);
		for (let i = 0; i < k; i++) await this.frame();
	}
	// let network + images finish while the video clock is stopped
	async settle(quiet = 250, rounds = 3) {
		for (let i = 0; i < rounds; i++) {
			await sleep(60);
			await this.page.eval('__vt.flush()');
			await this.page.idle(quiet);
		}
		await this.page.eval(
			`Promise.all([...document.images].filter(i=>!i.complete && i.getBoundingClientRect().top<1600).map(i=>Promise.race([i.decode().catch(()=>{}), new Promise(r=>{const c=new MessageChannel();let k=0;c.port1.onmessage=()=>{k++>4000?r():c.port2.postMessage(0)};c.port2.postMessage(0)})]))).then(()=>true)`,
		);
		this.tail = 4;
	}
	// find the center of an element; spec: css selector or {text, sel, nth}
	async box(spec) {
		const q = typeof spec === 'string' ? { sel: spec } : spec;
		const r = await this.page.eval(`(()=>{const q=${JSON.stringify(q)};
			let els=[...document.querySelectorAll(q.sel||'button,a,[role=button],label,[role=option],[role=menuitem]')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&b.height>0});
			if(q.text!=null)els=els.filter(e=>(e.innerText||'').trim()===q.text);
			if(q.has!=null)els=els.filter(e=>((e.innerText||'')+(e.getAttribute('aria-label')||'')).includes(q.has));
			if(q.aria!=null)els=els.filter(e=>(e.getAttribute('aria-label')||'').includes(q.aria));
			const e=els[q.nth||0]; if(!e) return null; const b=e.getBoundingClientRect();
			return {x:b.x+b.width*(q.fx??.5),y:b.y+b.height*(q.fy??.5),w:b.width,h:b.height,top:b.top,left:b.left};})()`);
		if (!r) throw new Error('not found: ' + JSON.stringify(spec));
		return r;
	}
	async tap(spec, { pre = 220, press = 90, settle = true, quiet = 250 } = {}) {
		const b = await this.box(spec);
		if (b.y > H || b.y < 0) throw new Error('offscreen tap ' + JSON.stringify(spec) + JSON.stringify(b));
		this.events.push({ f: this.map.length, x: b.x, y: b.y, pre, press });
		await this.hold(pre);
		await this.page.s('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x, y: b.y }] });
		await this.hold(press);
		await this.page.s('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
		await sleep(40);
		if (settle) await this.settle(quiet);
	}
	async scrollBy(dy, ms, sel = null) {
		const k = Math.round((ms / 1000) * FPS);
		const g = sel ? `document.querySelector(${JSON.stringify(sel)})` : 'document.scrollingElement';
		const from = await this.page.eval(`${g}.scrollTop`);
		this.events.push({ f: this.map.length, scroll: dy, ms });
		for (let i = 1; i <= k; i++) {
			const u = i / k;
			const e = u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2;
			await this.page.eval(`${g}.scrollTop=${from + dy * e}`);
			this.tail = 3;
			await this.frame();
		}
	}
	async type(text, per = 55) {
		for (const ch of text) {
			await this.page.s('Input.insertText', { text: ch });
			this.tail = 2;
			await this.hold(per);
		}
	}
	async end() {
				const meta = { fps: FPS, frames: this.map.length, map: this.map, events: this.events, marks: this.marks, box: this.box_, w: W, h: H };
		fs.writeFileSync(path.join(this.dir, 'clip.json'), JSON.stringify(meta));
		console.log(`${this.name}: ${this.map.length} frames (${(this.map.length / FPS).toFixed(2)}s), ${this.n} unique, taps ${this.events.filter((e) => e.x != null).length}`, JSON.stringify(this.marks));
	}
}
export { sleep, fs, path };
