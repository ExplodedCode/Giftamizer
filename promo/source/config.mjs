// Shared paths and lookups. Nothing here is tied to one seeding: ids are looked up by name at run time.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const SRC = import.meta.dirname;
export const APP = path.resolve(SRC, '../..');
export const OUT = path.join(APP, 'promo');
export const SUPA = process.env.PROMO_SUPABASE || path.resolve(APP, '../Giftamizer-Supabase');
// Frames, snapshots and browser profiles go here, outside the repo: the dev server watches the repo and would reload mid-take.
export const WORK = process.env.PROMO_WORK || path.join(os.tmpdir(), 'giftamizer-promo');
export const EDGE = process.env.PROMO_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
export const FFMPEG = process.env.PROMO_FFMPEG || 'ffmpeg';
export const BASE = 'http://localhost:3001';
export const DB_CONTAINER = 'supabase-db';
fs.mkdirSync(WORK, { recursive: true });

export const env = Object.fromEntries(
	fs
		.readFileSync(path.join(APP, '.env'), 'utf8')
		.split(/\r?\n/)
		.filter((l) => /^[A-Z_]+=/.test(l))
		.map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);
export const API = env.REACT_APP_SUPABASE_URL;
// Everything below signs in as test users and edits data, so refuse anything but the local stack.
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(API || '')) throw new Error(`REACT_APP_SUPABASE_URL is "${API}" - the promo scripts only run against the local dev stack`);

export const psql = (q, user = 'postgres') => execFileSync('docker', ['exec', '-i', DB_CONTAINER, 'psql', '-U', user, '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At'], { input: q, encoding: 'utf8', maxBuffer: 1 << 28 }).trim();

// cast and groups, as named by Giftamizer-Supabase/dev/seed-data.js
export const CAST = { carla: 'carla@giftamizer.test', alice: 'alice@giftamizer.test', ben: 'ben@giftamizer.test' };
export const GROUP_HOLIDAY = 'Holiday Gift Exchange';
export const GROUP_GAMES = 'Thursday Game Night Crew';

let cached;
export function ids() {
	if (cached) return cached;
	const q = (s) => psql(s).split('\n').filter(Boolean);
	const users = Object.fromEntries(Object.entries(CAST).map(([k, e]) => [k, q(`select user_id from profiles where email='${e}'`)[0]]));
	const group = (n) => q(`select id from groups where name='${n}'`)[0];
	cached = { ...users, holiday: group(GROUP_HOLIDAY), games: group(GROUP_GAMES) };
	const missing = Object.entries(cached).filter(([, v]) => !v);
	if (missing.length) throw new Error(`seed data not found: ${missing.map(([k]) => k).join(', ')} - seed the dev stack first (see README)`);
	return cached;
}

// seeded test accounts all share one password, documented in the backend README
export async function session(email) {
	const pw = fs.readFileSync(path.join(SUPA, 'README.md'), 'utf8').match(/share the password `([^`]+)`/)?.[1];
	if (!pw) throw new Error('seed password not found in Giftamizer-Supabase/README.md');
	const r = await fetch(`${API}/auth/v1/token?grant_type=password`, {
		method: 'POST',
		headers: { apikey: env.REACT_APP_SUPABASE_ANON_KEY, 'content-type': 'application/json' },
		body: JSON.stringify({ email, password: pw }),
	});
	if (!r.ok) throw new Error(`login failed for ${email}: ${r.status}`);
	return r.json();
}

// guided-tour steps, read from the app's own types so new steps are covered automatically
export function tourSteps() {
	const src = fs.readFileSync(path.join(APP, 'src/lib/useSupabase/types.ts'), 'utf8');
	const body = src.slice(src.indexOf('export interface TourSteps'));
	return [...body.slice(0, body.indexOf('\n}')).matchAll(/^\s+(\w+)\?: boolean;/gm)].map((m) => m[1]);
}
