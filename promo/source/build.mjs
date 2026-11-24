// node build.mjs audio [--regen]    soundtrack for the current timing -> WORK/master.wav (--regen: re-synthesize even if nothing moved)
// node build.mjs video v|h          render + mux -> promo/giftamizer-promo-*.mp4 (the old file is kept in WORK/previous)
// node build.mjs sheet <clip> [n]   contact sheet of one recorded clip -> WORK/sheet-<clip>.png
// node build.mjs qa v|h             contact sheet, loudness and hard-jump report for a finished video
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { FFMPEG, OUT, SRC, WORK } from './config.mjs';

const [cmd, a, b] = process.argv.slice(2);
const w = (f) => path.join(WORK, f);
const ff = (...args) => execFileSync(FFMPEG, ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
const ffErr = (...args) => spawnSync(FFMPEG, ['-hide_banner', '-nostats', ...args], { encoding: 'utf8', maxBuffer: 1 << 28 }).stderr;
const loudness = (f) => {
	const e = ffErr('-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-');
	const s = e.slice(e.lastIndexOf('Summary:'));
	return { I: s.match(/I:\s+(-?[\d.]+) LUFS/)?.[1], peak: s.match(/Peak:\s+(-?[\d.]+)/)?.[1] };
};
const node = (...args) => execFileSync(process.execPath, args, { stdio: 'inherit', cwd: SRC });
const target = (l) => path.join(OUT, `giftamizer-promo-${l === 'v' ? 'vertical-9x16' : 'landscape-16x9'}.mp4`);

function audio() {
	node('render.mjs', 'v', 'cues');
	const now = JSON.parse(fs.readFileSync(w('cues.json'), 'utf8'));
	const ok = JSON.parse(fs.readFileSync(path.join(SRC, 'approved-cues.json'), 'utf8'));
	const same = now.dur === ok.dur && now.outro === ok.outro && now.cues.length === ok.cues.length && now.cues.every((c, i) => c.k === ok.cues[i].k && c.id === ok.cues[i].id && Math.abs(c.t - ok.cues[i].t) < 0.04);
	if (same && a !== '--regen') {
		ff('-i', path.join(SRC, 'soundtrack.flac'), '-c:a', 'pcm_s16le', w('master.wav'));
		console.log('timing unchanged: using the approved soundtrack as is');
		return;
	}
	console.log('regenerating with the same instruments, tempo and arrangement');
	node('audio.mjs');
	ff('-i', w('audio.wav'), '-af', 'bass=g=-2:f=100,treble=g=5:f=3200', '-ar', '48000', '-c:a', 'pcm_f32le', w('eq.wav'));
	const gain = (-14 - Number(loudness(w('eq.wav')).I)).toFixed(2);
	ff('-i', w('eq.wav'), '-af', `volume=${gain}dB,alimiter=limit=0.87:level=false`, '-c:a', 'pcm_s16le', w('m1.wav'));
	ff('-i', w('m1.wav'), '-af', 'volume=0.6dB,alimiter=limit=0.72:level=false:attack=2:release=40', '-c:a', 'pcm_s16le', w('master.wav'));
}

if (cmd === 'audio') {
	audio();
	console.log(loudness(w('master.wav')));
} else if (cmd === 'video') {
	if (!['v', 'h'].includes(a)) throw new Error('video v|h');
	if (!fs.existsSync(w('master.wav'))) audio();
	node('render.mjs', a, 'video', w(`${a}-silent.mp4`), '60');
	const out = target(a);
	if (fs.existsSync(out)) {
		fs.mkdirSync(w('previous'), { recursive: true });
		fs.copyFileSync(out, path.join(w('previous'), `${Math.round(fs.statSync(out).mtimeMs)}-${path.basename(out)}`));
	}
	ff('-i', w(`${a}-silent.mp4`), '-i', w('master.wav'), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-metadata', 'title=Giftamizer', out);
	console.log(out, (fs.statSync(out).size / 1e6).toFixed(1) + ' MB', loudness(out));
} else if (cmd === 'sheet') {
	const n = Number(b || 8);
	const m = JSON.parse(fs.readFileSync(path.join(w('clips'), a, 'clip.json'), 'utf8'));
	const list = Array.from({ length: n }, (_, i) => `file '${path.join(w('clips'), a, String(m.map[Math.min(m.frames - 1, Math.round((i * (m.frames - 1)) / (n - 1)))]).padStart(5, '0') + '.jpg').replaceAll('\\', '/')}'\nduration 1`).join('\n');
	fs.writeFileSync(w('list.txt'), list);
	ff('-f', 'concat', '-safe', '0', '-i', w('list.txt'), '-vf', `scale=300:-1,tile=${n}x1`, '-frames:v', '1', w(`sheet-${a}.png`));
	console.log(w(`sheet-${a}.png`), JSON.stringify(m.marks));
} else if (cmd === 'qa') {
	const f = target(a);
	ff('-i', f, '-vf', a === 'v' ? 'fps=1,scale=216:-1,tile=14x4' : 'fps=1,scale=320:-1,tile=8x7', '-frames:v', '1', w(`qa-${a}.png`));
	const e = spawnSync(FFMPEG, ['-hide_banner', '-nostats', '-i', f, '-vf', 'scale=270:-1,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 28 }).stdout;
	const v = [...e.matchAll(/YAVG=([\d.]+)/g)].map((m) => +m[1]);
	const jumps = v.flatMap((x, i) => (i > 1 && i < v.length - 2 && x > 3 && x > 3 * Math.max(v[i - 1], v[i + 1], 0.3) ? [((i + 1) / 60).toFixed(2) + 's'] : []));
	console.log(w(`qa-${a}.png`), loudness(f));
	console.log('single-frame jumps (fine inside a scene where the app changes page, not fine at a scene boundary):', jumps.join(' ') || 'none');
} else console.log('usage: node build.mjs audio | video v|h | sheet <clip> [n] | qa v|h');
