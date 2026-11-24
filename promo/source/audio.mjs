// Original soundtrack + UI sounds, synthesized from scratch (no samples). 120 BPM, C major.
import fs from 'node:fs';
import path from 'node:path';

import { WORK } from './config.mjs';

const { dur, outro, cues } = JSON.parse(fs.readFileSync(path.join(WORK, 'cues.json'), 'utf8'));
const SR = 48000;
const N = Math.round((dur + 0.0) * SR);
const bus = () => [new Float32Array(N), new Float32Array(N)];
const dry = bus();
const music = bus(); // ducked by the kick
const wet = bus(); // reverb send
const BEAT = 0.5;
let seed = 1;
const rand = () => {
	seed = (seed * 1664525 + 1013904223) >>> 0;
	return seed / 4294967296;
};
const midi = (m) => 440 * 2 ** ((m - 69) / 12);
const TAU = Math.PI * 2;

function put(b, t, len, fn, gain = 1, pan = 0, send = 0) {
	const s0 = Math.round(t * SR);
	const n = Math.round(len * SR);
	const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4) * 1.2;
	const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4) * 1.2;
	for (let i = 0; i < n; i++) {
		const k = s0 + i;
		if (k < 0 || k >= N) continue;
		const v = fn(i / SR, i);
		b[0][k] += v * gl;
		b[1][k] += v * gr;
		if (send) {
			wet[0][k] += v * gl * send;
			wet[1][k] += v * gr * send;
		}
	}
}
// ---- instruments
const bell = (t, m, g = 0.2, pan = 0, send = 0.5, len = 1.4) => {
	const f = midi(m);
	put(music, t, len, (x) => Math.exp(-x * 4.2) * (Math.sin(TAU * f * x + 1.6 * Math.exp(-x * 9) * Math.sin(TAU * f * 3.01 * x)) + 0.22 * Math.exp(-x * 7) * Math.sin(TAU * f * 4 * x)) * Math.min(1, x * 900), g, pan, send);
};
const marimba = (t, m, g = 0.22, pan = 0, send = 0.22) => {
	const f = midi(m);
	put(music, t, 0.6, (x) => Math.min(1, x * 1200) * (Math.exp(-x * 8) * Math.sin(TAU * f * x) + 0.35 * Math.exp(-x * 26) * Math.sin(TAU * f * 3.93 * x) + 0.12 * Math.exp(-x * 50) * Math.sin(TAU * f * 9.2 * x)), g, pan, send);
};
const pizz = (t, m, g = 0.22, pan = 0) => {
	const f = midi(m);
	put(music, t, 0.5, (x) => Math.min(1, x * 700) * Math.exp(-x * 11) * (Math.sin(TAU * f * x) + 0.5 * Math.exp(-x * 14) * Math.sin(TAU * f * 2 * x) + 0.28 * Math.exp(-x * 20) * Math.sin(TAU * f * 3 * x) + 0.14 * Math.exp(-x * 30) * Math.sin(TAU * f * 4 * x)), g, pan, 0.3);
};
const bass = (t, m, len, g = 0.3) => {
	const f = midi(m);
	put(music, t, len, (x) => {
		const e = Math.min(1, x * 250) * Math.min(1, (len - x) * 40) * (0.55 + 0.45 * Math.exp(-x * 6));
		return e * Math.tanh(1.5 * (Math.sin(TAU * f * x) + 0.32 * Math.sin(TAU * f * 2 * x) + 0.1 * Math.exp(-x * 12) * Math.sin(TAU * f * 5 * x)));
	}, g);
};
const pad = (t, notes, len, g = 0.05) => {
	notes.forEach((m, i) => {
		for (const [d, p] of [[-0.06, -0.7], [0.05, 0.7], [0, 0]]) {
			const f = midi(m + d);
			const ph = rand() * TAU;
			put(music, t, len + 0.3, (x) => {
				const e = Math.min(1, x / 0.18) * Math.min(1, (len + 0.3 - x) / 0.3);
				let v = 0;
				for (let h = 1; h <= 5; h++) v += Math.sin(TAU * f * h * x + ph * h) / (h * h * 0.9);
				return v * e * (0.9 + 0.1 * Math.sin(TAU * 0.6 * x + i));
			}, g, p, 0.35);
		}
	});
};
const kick = (t, g = 0.75) => {
	put(dry, t, 0.28, (x) => Math.sin(TAU * (48 * x + (110 / 34) * (1 - Math.exp(-x * 34)))) * Math.exp(-x * 13) * Math.min(1, x * 900) + 0.18 * Math.exp(-x * 260) * (rand() * 2 - 1), g);
	kicks.push(t);
};
const kicks = [];
const clap = (t, g = 0.24) => {
	let lp = 0;
	let hp = 0;
	put(dry, t, 0.3, (x) => {
		const n = rand() * 2 - 1;
		lp += 0.5 * (n - lp);
		hp += 0.16 * (lp - hp);
		const env = Math.exp(-x * 24) + 0.8 * (x < 0.012 ? 1 : 0) + 0.6 * (x > 0.014 && x < 0.024 ? 1 : 0);
		return (lp - hp) * env;
	}, g, 0.05, 0.35);
};
const hat = (t, g = 0.05, pan = 0.2, dec = 60) => {
	let p = 0;
	put(dry, t, 0.12, (x) => {
		const n = rand() * 2 - 1;
		const h = n - p;
		p = n;
		return h * Math.exp(-x * dec);
	}, g, pan, 0.05);
};
const sleigh = (t, g = 0.06) => {
	const fs_ = [4150, 5230, 6120, 7350, 8420].map((f) => f * (0.985 + rand() * 0.03));
	put(dry, t, 0.28, (x) => Math.min(1, x * 400) * Math.exp(-x * 15) * fs_.reduce((s, f, i) => s + Math.sin(TAU * f * x + i * 1.7) * (0.6 + 0.4 * Math.sin(TAU * 31 * x + i)), 0) * 0.3, g, -0.25, 0.3);
};
const whoosh = (t, len = 0.5, g = 0.16, up = true) => {
	let a = 0;
	let b = 0;
	put(dry, t, len, (x) => {
		const u = x / len;
		const fc = up ? 400 + 4200 * u * u : 4200 - 3600 * u;
		const k = 1 - Math.exp((-TAU * fc) / SR);
		const n = rand() * 2 - 1;
		a += k * (n - a);
		b += k * 0.35 * (a - b);
		return (a - b) * Math.sin(Math.PI * Math.min(1, u)) ** 1.6;
	}, g, 0, 0.2);
};
const tick = (t, g = 0.2) => {
	put(dry, t, 0.06, (x) => Math.sin(TAU * (1500 * x - 6000 * x * x)) * Math.exp(-x * 90) * Math.min(1, x * 2500) + 0.4 * Math.sin(TAU * 420 * x) * Math.exp(-x * 110), g, 0, 0.08);
};
const pop = (t, m = 76, g = 0.2) => {
	const f = midi(m);
	put(dry, t, 0.16, (x) => Math.sin(TAU * f * (x + 0.9 * x * x * 4)) * Math.exp(-x * 28) * Math.min(1, x * 1200), g, 0, 0.2);
};
const sparkle = (t, base = 84, g = 0.13) => [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => bell(t + i * 0.055, base + n, g * (1 - i * 0.07), -0.6 + i * 0.2, 0.7, 1.2));
const riser = (t, len, g = 0.12) => {
	let a = 0;
	put(dry, t, len, (x) => {
		const u = x / len;
		const k = 1 - Math.exp((-TAU * (300 + 6500 * u ** 2)) / SR);
		a += k * (rand() * 2 - 1 - a);
		return a * u ** 2.2;
	}, g, 0, 0.25);
};
const crash = (t, g = 0.14) => {
	let p = 0;
	put(dry, t, 1.8, (x) => {
		const n = rand() * 2 - 1;
		const h = n - 0.82 * p;
		p = n;
		return h * Math.exp(-x * 3.2) * Math.min(1, x * 400);
	}, g, 0.1, 0.4);
};

// ---- harmony: one chord per second (2 beats), 8-second loop starting at t=3
const CH = [
	{ r: 36, n: [60, 64, 67, 71] }, // Cmaj7
	{ r: 43, n: [59, 62, 67, 74] }, // G
	{ r: 45, n: [60, 64, 69, 72] }, // Am
	{ r: 41, n: [57, 60, 65, 72] }, // F
	{ r: 36, n: [60, 64, 67, 72] }, // C
	{ r: 40, n: [59, 64, 67, 71] }, // Em
	{ r: 41, n: [57, 60, 65, 69] }, // F
	{ r: 43, n: [59, 62, 67, 71] }, // G
];
const chordAt = (t) => CH[(((Math.floor(t - 3 + 1e-6) % 8) + 8) % 8)];
const END = outro + 4; // last groove bar; final chord rings after
const inBreak = (t) => t >= 29 && t < 33;

// intro (0-3): pad swell, rising bells, gift pop
pad(0, [48, 55, 60, 64], 2.9, 0.034);
[72, 76, 79, 84, 88].forEach((m, i) => bell(0.5 + i * 0.09, m, 0.16, -0.4 + i * 0.2, 0.6));
[67, 72, 76, 79].forEach((m, i) => bell(0.96 + i * 0.12, m, 0.17, 0.3 - i * 0.2, 0.6));
[74, 79, 83, 86].forEach((m, i) => bell(1.96 + i * 0.12, m, 0.14, -0.3 + i * 0.2, 0.6));
put(dry, 0.36, 0.5, (x) => Math.sin(TAU * (60 * x + 2.4 * (1 - Math.exp(-x * 30)))) * Math.exp(-x * 9), 0.5, 0, 0.1);
pop(0.52, 72, 0.32);
riser(1.7, 1.3, 0.13);
for (let k = 0; k < 4; k++) hat(2.5 + k * 0.125, 0.04 + k * 0.012, 0);

for (let t = 3; t < END - 1e-6; t += 1) {
	const c = chordAt(t);
	pad(t, c.n, 1.0, inBreak(t) ? 0.02 : 0.026);
}
// groove
for (let t = 3; t < END - 1e-6; t += BEAT) {
	const beat = Math.round((t - 3) / BEAT);
	const c = chordAt(t);
	const brk = inBreak(t);
	if (!brk) {
		kick(t, 0.66);
		if (beat % 2 === 1 && t >= 5) clap(t, t >= 13 ? 0.24 : 0.16);
		hat(t + 0.25, t >= 13 ? 0.055 : 0.035, 0.25);
		if (t >= 13) {
			hat(t + 0.125, 0.018, -0.3);
			hat(t + 0.375, 0.022, -0.3);
		}
		bass(t, c.r, 0.2, 0.25);
		bass(t + 0.25, c.r + (beat % 4 === 3 ? 7 : 12), 0.2, 0.2);
	} else {
		// sneaky pizzicato break for "the surprise stays safe"
		const sn = [45, 52, 57, 60, 59, 56, 52, 47];
		pizz(t, sn[beat % 8] + 12, 0.28, -0.2);
		pizz(t + 0.25, sn[(beat + 2) % 8] + 12, 0.14, 0.25);
		hat(t + 0.25, 0.03, 0.2, 90);
		if (beat % 2 === 0) bass(t, c.r, 0.4, 0.16);
	}
	if ((t >= 36 && t < 44) || t >= 47) {
		sleigh(t, 0.075);
		sleigh(t + 0.25, 0.045);
	}
}
// marimba arpeggio, 8ths with a few 16th pushes
for (let t = 3; t < END - 1e-6; t += 0.25) {
	if (inBreak(t)) continue;
	const c = chordAt(t);
	const k = Math.round((t - 3) / 0.25);
	const pat = [0, 2, 1, 3, 2, 3, 1, 2];
	const n = c.n[pat[k % 8]] + 12;
	marimba(t, n, 0.2, k % 2 ? 0.35 : -0.35);
	if (k % 8 === 3 || k % 8 === 6) marimba(t + 0.125, n + (k % 16 > 8 ? 12 : 0), 0.08, 0.1);
}
// melody: short hook on bells, once the story gets going
const HOOK = [
	[0, 79], [0.5, 76], [0.75, 79], [1.25, 83], [2, 84], [2.5, 79], [3, 77], [3.5, 76],
	[4, 79], [4.5, 76], [4.75, 79], [5.25, 84], [6, 81], [6.5, 79], [7, 74], [7.5, 79],
];
for (const start of [11, 19, 37, 45]) {
	for (const [o, m] of HOOK) {
		const t = start + o;
		if (t >= END || inBreak(t)) continue;
		bell(t, m, start >= 37 ? 0.17 : 0.14, 0.15, 0.55);
		if (start >= 37) bell(t, m + 12, 0.035, -0.3, 0.6);
	}
}
// fills and drops
for (const t of [13, 25, 33, 36, 44, outro]) crash(t, 0.1);
crash(3, 0.13);
riser(32, 1, 0.1);
riser(outro - 1, 1, 0.1);
for (const t of [12.5, 24.5, 35.5, 43.5, outro - 0.5]) [0, 0.125, 0.25, 0.375].forEach((o, i) => clap(t + o, 0.08 + i * 0.035));
// ending
const F = END;
pad(F, [48, 55, 60, 64, 67, 72], 1.6, 0.034);
bass(F, 36, 1.4, 0.32);
kick(F, 0.8);
crash(F, 0.12);
[72, 76, 79, 84, 88, 91].forEach((m, i) => bell(F + i * 0.07, m, 0.17, -0.5 + i * 0.2, 0.7, 1.6));

// ---- UI sounds
for (const c of cues) {
	if (c.k === 'tap') tick(c.t, 0.3);
	if (c.k === 'cut' && c.t > 3) whoosh(c.t - 0.22, 0.5, 0.13);
}
whoosh(2.55, 0.6, 0.2);
whoosh(outro - 0.25, 0.7, 0.18);
const at = Object.fromEntries(cues.filter((c) => c.k === 'cut').map((c) => [c.id, c.t]));
pop(at.add + 0.58, 74, 0.2);
sparkle(at.add + 1.95, 84, 0.12);
pop(at.add + 2.12, 79, 0.16);
pop(at.add + 2.27, 81, 0.16);
pop(at.add + 2.42, 84, 0.16);
pop(at.lists + 1.67, 79, 0.18);
pop(at.privacy + 0.82, 72, 0.2);
pop(at.privacy + 1.02, 76, 0.2);
// claim: two confirming notes
[[1.28, 76], [2.72, 81]].forEach(([o, m]) => {
	bell(at.claim + o, m, 0.15, 0, 0.5);
	bell(at.claim + o + 0.08, m + 5, 0.13, 0, 0.5);
});
// Secret Santa: shuffle flutter, then the reveal
for (let i = 0; i < 9; i++) hat(at.santa + 5.35 + i * 0.05, 0.05 + i * 0.006, i % 2 ? 0.5 : -0.5, 120);
sparkle(at.santa + 5.85, 84, 0.16);
pop(at.santa + 5.85, 76, 0.2);
sparkle(outro + 0.85, 84, 0.14);
pop(outro + 1.12, 74, 0.22);

// ---- sidechain + reverb + master
const duck = new Float32Array(N).fill(1);
for (const t of kicks) {
	const s0 = Math.round(t * SR);
	for (let i = 0; i < 0.24 * SR; i++) if (s0 + i < N) duck[s0 + i] = Math.min(duck[s0 + i], 1 - 0.42 * Math.exp((-i / SR) * 13));
}
function reverb(x, offs) {
	const out = new Float32Array(N);
	const combs = [1557, 1617, 1491, 1422, 1277, 1356].map((d) => Math.round((d + offs) * 1.09));
	for (const d of combs) {
		const buf = new Float32Array(d);
		let k = 0;
		let lp = 0;
		for (let i = 0; i < N; i++) {
			const y = buf[k];
			lp = y * 0.72 + lp * 0.28;
			buf[k] = x[i] + lp * 0.83;
			out[i] += y / 6;
			if (++k === d) k = 0;
		}
	}
	for (const d0 of [225, 556, 441, 341]) {
		const d = d0 + (offs >> 1);
		const buf = new Float32Array(d);
		let k = 0;
		for (let i = 0; i < N; i++) {
			const y = buf[k];
			const v = out[i] + y * 0.5;
			buf[k] = v;
			out[i] = y - 0.5 * v;
			if (++k === d) k = 0;
		}
	}
	return out;
}
const rL = reverb(wet[0], 0);
const rR = reverb(wet[1], 23);
let peak = 0;
const L = new Float32Array(N);
const R = new Float32Array(N);
for (let i = 0; i < N; i++) {
	const t = i / SR;
	const fade = Math.min(1, t / 0.02) * Math.min(1, (dur - t) / 0.9);
	L[i] = Math.tanh((dry[0][i] + music[0][i] * duck[i] + rL[i] * 0.55) * 1.05) * fade;
	R[i] = Math.tanh((dry[1][i] + music[1][i] * duck[i] + rR[i] * 0.55) * 1.05) * fade;
	peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const g = 0.92 / peak;
const pcm = Buffer.alloc(44 + N * 4);
pcm.write('RIFF', 0);
pcm.writeUInt32LE(36 + N * 4, 4);
pcm.write('WAVEfmt ', 8);
pcm.writeUInt32LE(16, 16);
pcm.writeUInt16LE(1, 20);
pcm.writeUInt16LE(2, 22);
pcm.writeUInt32LE(SR, 24);
pcm.writeUInt32LE(SR * 4, 28);
pcm.writeUInt16LE(4, 32);
pcm.writeUInt16LE(16, 34);
pcm.write('data', 36);
pcm.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
	pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4);
	pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4);
}
fs.writeFileSync(path.join(WORK, 'audio.wav'), pcm);
console.log('audio.wav', dur + 's', 'raw peak', peak.toFixed(2));
