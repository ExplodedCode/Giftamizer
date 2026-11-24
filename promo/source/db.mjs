// Borrow the local dev data for recording, then put it back exactly.
//   node db.mjs snapshot   save the current public tables (run once, before anything else)
//   node db.mjs prep       set the data up for a take (also use between takes)
//   node db.mjs check      list differences from the snapshot
//   node db.mjs restore    put everything back, including updated_at, and verify
//   node db.mjs selftest   prove prep + restore work inside a transaction that is rolled back
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { API, CAST, DB_CONTAINER, GROUP_GAMES, SUPA, WORK, env, ids, psql, session, tourSteps } from './config.mjs';

const FILE = path.join(WORK, 'db-snapshot.json');
const DUMP = path.join(WORK, 'db-snapshot.dump');
const cmd = process.argv[2];

const meta = () => {
	const pk = JSON.parse(
		psql(`select json_object_agg(t, cols) from (select c.relname t, json_agg(a.attname) cols from pg_index i join pg_class c on c.oid=i.indrelid join pg_namespace n on n.oid=c.relnamespace join pg_attribute a on a.attrelid=c.oid and a.attnum=any(i.indkey) where i.indisprimary and n.nspname='public' and c.relkind='r' group by 1) s`),
	);
	return pk;
};
const load = () => {
	if (!fs.existsSync(FILE)) throw new Error('no snapshot yet - run: node db.mjs snapshot');
	return JSON.parse(fs.readFileSync(FILE, 'utf8'));
};
const lit = (s) => `$snap$${s}$snap$`;

function prepSql() {
	const id = ids();
	const tour = JSON.stringify(Object.fromEntries(tourSteps().map((k) => [k, true])));
	const snap = load();
	const seen = snap.tables.profiles.find((p) => p.user_id === id.carla)?.feed_seen_at;
	return `
-- no guided-tour popups, no notification badge, unread dots back on the feed
update profiles set tour='${tour}'::jsonb where email in (${Object.values(CAST).map((e) => `'${e}'`).join(',')});
update profiles set feed_seen_at='${seen}', feed_hidden='{}', enable_archive=false, enable_trash=false, enable_snowfall=false where user_id='${id.carla}';
update notifications set seen=true;
-- Carla's Default list would otherwise show a "not assigned any groups" warning
insert into lists_groups(list_id, group_id, user_id) select l.id, g.id, l.user_id from lists l, groups g where l.name='Default' and l.user_id='${id.carla}' on conflict do nothing;
-- claims: drop the ones made by earlier takes, then give the shopping list something to show
delete from items_status where user_id='${id.carla}' and item_id not in (select (x->>'item_id')::uuid from jsonb_array_elements(${lit(JSON.stringify(snap.tables.items_status))}::jsonb) x);
insert into items_status(item_id, user_id, status) select i.id, '${id.carla}', 'P' from items i where i.name in ('Rumpl Original Puffy Blanket','Gravity Chunky Knit Weighted Blanket','Victrola Eastwood II Record Player') on conflict do nothing;
-- Secret Santa not drawn yet in the group Carla co-owns
update groups set secret_santa='{"status":"init"}' where name='${GROUP_GAMES}' and secret_santa->>'status' is distinct from 'init';
-- feed events caused by earlier takes
delete from activity where created_at > '${snap.at}';
`;
}

function restoreSql(snap) {
	const pk = meta();
	let out = 'set local session_replication_role = replica;\n'; // no triggers: rows go back untouched
	for (const [t, rows] of Object.entries(snap.tables)) {
		const keys = pk[t];
		const cols = snap.columns[t];
		const on = (a, b) => keys.map((k) => `${a}."${k}" is not distinct from ${b}."${k}"`).join(' and ');
		out += `create temp table snap_${t} on commit drop as select * from jsonb_populate_recordset(null::public."${t}", ${lit(JSON.stringify(rows))}::jsonb);
delete from public."${t}" c where not exists (select 1 from snap_${t} s where ${on('c', 's')});
update public."${t}" c set ${cols.map((k) => `"${k}"=s."${k}"`).join(', ')} from snap_${t} s where ${on('c', 's')} and to_jsonb(c) is distinct from to_jsonb(s);
insert into public."${t}" select s.* from snap_${t} s where not exists (select 1 from public."${t}" c where ${on('c', 's')});
`;
	}
	return out;
}
// one row per table that differs from the snapshot
const diffSql = (snap) =>
	Object.entries(snap.tables)
		.map(([t, rows]) => `select '${t}' t, count(*) n from ((select to_jsonb(c) from public."${t}" c except select to_jsonb(s) from jsonb_populate_recordset(null::public."${t}", ${lit(JSON.stringify(rows))}::jsonb) s) union all (select to_jsonb(s) from jsonb_populate_recordset(null::public."${t}", ${lit(JSON.stringify(rows))}::jsonb) s except select to_jsonb(c) from public."${t}" c)) d`)
		.join('\nunion all ');
const diff = (snap) => psql(`select t||' '||n from (${diffSql(snap)}) x where n>0;`).split('\n').filter(Boolean);
const objects = () => psql("select bucket_id||'/'||name from storage.objects order by 1").split('\n').filter(Boolean);

// items created by a take are deleted through the API as their owner, so the app's own trigger removes the files too
async function deleteNewItems(snap) {
	const known = new Set(snap.tables.items.map((i) => i.id));
	const now = psql('select i.id||\'|\'||p.email||\'|\'||i.name from items i join profiles p using (user_id)').split('\n').filter(Boolean).map((l) => l.split('|'));
	for (const [id, email, name] of now.filter(([id]) => !known.has(id))) {
		if (!email.endsWith('@giftamizer.test')) throw new Error(`unexpected new item "${name}" by ${email} - not touching it`);
		const s = await session(email);
		const r = await fetch(`${API}/rest/v1/items?id=eq.${id}`, { method: 'DELETE', headers: { apikey: env.REACT_APP_SUPABASE_ANON_KEY, authorization: `Bearer ${s.access_token}` } });
		console.log('deleted recorded item:', name.slice(0, 40), r.status);
	}
}

if (cmd === 'snapshot') {
	if (fs.existsSync(FILE)) throw new Error(`a snapshot already exists (${FILE}). It may hold the only copy of the original data: run "restore" first, then move that file away.`);
	ids(); // makes sure the seed is there
	const at = psql('select now()');
	const tables = {};
	const columns = {};
	for (const t of Object.keys(meta())) {
		tables[t] = JSON.parse(psql(`select coalesce(json_agg(to_jsonb(x)),'[]') from public."${t}" x`));
		columns[t] = JSON.parse(psql(`select json_agg(column_name) from information_schema.columns where table_schema='public' and table_name='${t}'`));
	}
	fs.writeFileSync(DUMP, execFileSync('docker', ['exec', DB_CONTAINER, 'pg_dump', '-U', 'postgres', '-Fc', '-n', 'public', '-n', 'auth', '-n', 'storage', 'postgres'], { maxBuffer: 1 << 28 }));
	fs.writeFileSync(FILE, JSON.stringify({ at, tables, columns, objects: objects() }));
	console.log(`snapshot at ${at}:`, Object.entries(tables).map(([t, r]) => `${t} ${r.length}`).join(', '));
} else if (cmd === 'prep') {
	const snap = load();
	await deleteNewItems(snap);
	psql(`begin;${prepSql()}commit;`);
	console.log('ready to record');
} else if (cmd === 'check') {
	const d = diff(load());
	console.log(d.length ? 'rows differing from the snapshot: ' + d.join(', ') : 'identical to the snapshot');
} else if (cmd === 'restore') {
	const snap = load();
	await deleteNewItems(snap);
	psql(`begin;\n${restoreSql(snap)}commit;`, 'supabase_admin');
	psql(`delete from auth.sessions where user_agent='node' and created_at > '${snap.at}'`, 'supabase_admin');
	const d = diff(snap);
	const was = new Set(snap.objects);
	const is = objects();
	const extra = is.filter((o) => !was.has(o));
	const lost = snap.objects.filter((o) => !is.includes(o));
	console.log(d.length ? 'STILL DIFFERENT: ' + d.join(', ') : 'tables identical to the snapshot');
	console.log(extra.length || lost.length ? `STORAGE DIFFERS: extra ${extra.join(', ') || 'none'}; missing ${lost.join(', ') || 'none'}` : 'stored files identical');
	if (d.length || extra.length || lost.length) process.exit(1);
} else if (cmd === 'selftest') {
	const snap = load();
	const out = psql(`begin;\n${prepSql()}\nselect 'after prep: '||t||' '||n from (${diffSql(snap)}) x where n>0;\n${restoreSql(snap)}\nselect 'after restore: '||count(*)||' tables differ' from (${diffSql(snap)}) x where n>0;\nrollback;`, 'supabase_admin');
	console.log(out.split('\n').filter((l) => l.startsWith('after')).join('\n'));
} else {
	console.log('usage: node db.mjs snapshot | prep | check | restore | selftest');
}
