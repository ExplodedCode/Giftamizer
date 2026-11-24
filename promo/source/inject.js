(() => {
	try {
		localStorage.setItem('giftamizer-theme', 'light');
	} catch (e) {}
	const css = `
	/* dev-only elements: account switcher button + DEV chip next to the logo */
	button[class*="z-[1400]"][class*="bg-festive"]{display:none!important}
	header.fixed > a + div[class*="bg-festive"]{display:none!important}
	*{caret-color:transparent!important}
	[data-radix-popper-content-wrapper] *{outline:none!important}
	[data-radix-popper-content-wrapper]:has([role=tooltip]){display:none!important}
	::-webkit-scrollbar{display:none!important;width:0!important}
	html{-webkit-tap-highlight-color:transparent}
	`;
	const add = () => {
		if (document.getElementById('promo-css')) return;
		const st = document.createElement('style');
		st.id = 'promo-css';
		st.textContent = css;
		(document.head || document.documentElement).appendChild(st);
	};
	if (document.documentElement) add();
	document.addEventListener('DOMContentLoaded', add);

	// --- virtual clock: lets each video frame be captured at an exact time ---
	const R = {
		setTimeout: window.setTimeout.bind(window),
		clearTimeout: window.clearTimeout.bind(window),
		setInterval: window.setInterval.bind(window),
		clearInterval: window.clearInterval.bind(window),
		raf: window.requestAnimationFrame.bind(window),
		caf: window.cancelAnimationFrame.bind(window),
		now: performance.now.bind(performance),
	};
	let virtual = false;
	let vnow = 0;
	let offset = 0;
	let seq = 1e6;
	const timers = new Map();
	const rafs = new Map();
	const now = () => (virtual ? vnow : R.now() + offset);
	performance.now = now;
	window.setTimeout = (fn, d = 0, ...a) => {
		d = +d || 0;
		if (!virtual || d < 8 || typeof fn !== 'function') return R.setTimeout(fn, d, ...a);
		const id = ++seq;
		timers.set(id, { at: vnow + d, fn, a });
		return id;
	};
	window.clearTimeout = (id) => {
		if (timers.has(id)) timers.delete(id);
		else R.clearTimeout(id);
	};
	window.setInterval = (fn, d = 0, ...a) => {
		if (!virtual || typeof fn !== 'function') return R.setInterval(fn, d, ...a);
		const id = ++seq;
		timers.set(id, { at: vnow + d, fn, a, every: Math.max(d, 8) });
		return id;
	};
	window.clearInterval = (id) => {
		if (timers.has(id)) timers.delete(id);
		else R.clearInterval(id);
	};
	window.requestAnimationFrame = (fn) => {
		if (!virtual) return R.raf(() => fn(now()));
		const id = ++seq;
		rafs.set(id, fn);
		return id;
	};
	window.cancelAnimationFrame = (id) => {
		if (rafs.has(id)) rafs.delete(id);
		else R.caf(id);
	};
	const flush = () =>
		new Promise((r) =>
			R.setTimeout(() => {
				const c = new MessageChannel();
				c.port1.onmessage = () => R.setTimeout(r, 0);
				c.port2.postMessage(0);
			}, 0),
		);
	let dirty = true;
	let obs;
	const seen = new WeakMap();
	const anims = (dt) => {
		let n = 0;
		for (const a of document.getAnimations()) {
			if (a.playState === 'finished' || a.playState === 'idle') continue;
			const end = a.effect ? a.effect.getComputedTiming().endTime : 0;
			n++;
			if (!seen.has(a)) {
				a.pause();
				a.currentTime = 0;
				seen.set(a, 1);
				continue;
			}
			if (!dt) continue;
			const t = Number(a.currentTime || 0) + dt;
			if (t >= end) {
				try {
					a.finish();
				} catch (e) {
					a.cancel();
				}
			} else a.currentTime = t;
		}
		return n;
	};
	window.__vt = {
		on() {
			if (virtual) return;
			vnow = R.now() + offset;
			virtual = true;
			if (!obs) {
				obs = new MutationObserver(() => {
					dirty = true;
				});
				obs.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
			}
		},
		async flush() {
			await flush();
			if (window.__fix) window.__fix();
			anims(0);
			return true;
		},
		async step(dt) {
			vnow += dt;
			for (const [id, t] of [...timers].sort((x, y) => x[1].at - y[1].at)) {
				if (t.at > vnow || !timers.has(id)) continue;
				if (t.every) t.at += t.every;
				else timers.delete(id);
				try {
					t.fn(...(t.a || []));
				} catch (e) {
					console.error(e);
				}
			}
			const n = anims(dt);
			const q = [...rafs.values()];
			rafs.clear();
			for (const f of q) {
				try {
					f(vnow);
				} catch (e) {
					console.error(e);
				}
			}
			await flush();
			if (window.__fix) window.__fix();
			const n2 = anims(0);
			const d = dirty;
			dirty = false;
			return { busy: n + n2 > 0 || d || q.length > 0, n: n + n2, d, q: q.length };
		},
	};
})();
