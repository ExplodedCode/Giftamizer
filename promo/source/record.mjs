// node record.mjs all            every clip, in the order the data needs
// node record.mjs claim santa    just these
import { openAs, done, Clip, fs, path, sleep } from './app.mjs';
import { BASE as base, WORK, ids } from './config.mjs';

const { holiday: G1, games: G2, ben: BEN } = ids();
// Order matters: wishlist shots before "add" puts a new item on top; claim before the three clips that show its result;
// "invite" before names are drawn; "feed" late, since opening it clears the unread dot, but before "santa", whose draw adds a
// second banner to the feed; "settings" (turns snow on) before "snow".
const ORDER = ['landing', 'items', 'gallery', 'lists', 'groups', 'invite', 'claim', 'alice', 'ben', 'shopping', 'add', 'feed', 'santa', 'settings', 'snow'];
const only = process.argv.slice(2).join() === 'all' ? ORDER : process.argv.slice(2);

// The pasted link, and the link-import service's real answer for it (cached so every take is the same)
const LINK = 'https://www.thesill.com/products/snake-plant-laurentii';
const metaFile = path.join(WORK, 'link-import.json');
async function linkImport() {
	if (!fs.existsSync(metaFile)) {
		const r = await fetch('http://localhost:5500', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: LINK }) });
		const body = await r.text();
		const d = JSON.parse(body);
		if (!d.title || !d.images?.length) throw new Error('link import returned no title or images: pick another product link');
		fs.writeFileSync(metaFile, body);
	}
	return fs.readFileSync(metaFile, 'utf8');
}

// the on-screen card of an item, so the composition can outline it: [x, y, width, height]
const cardBox = (p, name) =>
	p.eval(`(()=>{let c=[...document.querySelectorAll('p')].find(b=>b.innerText.startsWith(${JSON.stringify(name)}));while(c.parentElement&&c.parentElement.getBoundingClientRect().height<320)c=c.parentElement;const b=c.getBoundingClientRect();return [b.x,b.y,b.width,b.height]})()`);

// wait for a condition while the video clock is stopped
const until = async (p, expr, ms = 8000) => {
	const t = Date.now();
	while (Date.now() - t < ms) {
		if (await p.eval(`!!(${expr})`)) return;
		await p.eval('__vt.flush()');
		await sleep(60);
	}
	throw new Error('timeout: ' + expr);
};
const clips = {
	async landing() {
		const p = await openAs(null, { url: base + '/' });
		const c = await new Clip(p, 'landing').start();
		await c.hold(500);
		await c.scrollBy(1500, 2600);
		await c.hold(300);
		await c.end();
	},

	async items() {
		const p = await openAs('carla');
		const c = await new Clip(p, 'items').start();
		await c.hold(500);
		await c.scrollBy(1080, 2200);
		await c.hold(200);
		await c.end();
	},

	// paste a link -> details fill in -> pick a list -> create
	async add() {
		const meta = await linkImport();
		const title = JSON.parse(meta).title;
		const p = await openAs('carla', { routes: [{ match: '/functions/v1/url-metadata', body: meta, before: () => gate }] });
		let release;
		var gate = new Promise((r) => (release = r));
		const c = await new Clip(p, 'add').start();
		await c.hold(300);
		await c.tap({ sel: 'button', aria: 'add' }, { pre: 250 });
		await c.hold(500);
		c.mark('dialog');
		const url = await c.box({ sel: '[tour-element=item_url]' });
		console.log('url field', url);
		await c.tap({ sel: '[tour-element=item_url]' }, { pre: 200 });
		c.mark('paste');
		await p.eval(`(()=>{const e=document.querySelector('[tour-element=item_url]');e.focus();
			const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
			set.call(e,${JSON.stringify(LINK)});
			e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertFromPaste'}));})()`);
		await p.eval('__vt.flush()');
		c.tail = 4;
		await c.hold(900);
		release();
		await until(p, `[...document.querySelectorAll('input')].some(i=>i.value.startsWith(${JSON.stringify(title.slice(0, 12))}))`);
		await c.settle(300);
		await until(p, `document.querySelectorAll('[data-tile-key] img').length>0`);
		await c.settle(200);
		c.mark('filled');
		await c.hold(1300);
		// pick a list
		const dlg = '[data-slot=dialog-content]';
		const sh = await p.eval(`(()=>{const d=document.querySelector('${dlg}');return [d.scrollHeight,d.clientHeight]})()`);
		console.log('dialog', sh);
		await c.scrollBy(sh[0] - sh[1], 700, dlg);
		c.mark('lists');
		await c.tap({ sel: '[tour-element=item_list_assign]' }, { pre: 160 });
		await c.hold(350);
		await c.tap({ sel: '[cmdk-item]', has: "Mom's Wishlist" }, { pre: 220 });
		await c.hold(250);
		// close the picker
		await p.s('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
		await p.s('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
		await c.settle();
		await c.hold(350);
		await c.tap({ sel: '[tour-element=item_create_btn]' }, { pre: 250, settle: false });
		await c.hold(260);
		await c.settle(600, 5);
		await until(p, `location.hash===''||location.hash==='#'`);
		await c.settle(700, 4);
		c.mark('created');
		await c.hold(1500);
		await c.end();
	},

	// photo gallery
	async gallery() {
		const p = await openAs('carla');
		await p.eval(`(()=>{const b=document.querySelector('[aria-label^="View image of MAGNA"]');const y=b.getBoundingClientRect().top+scrollY-150;scrollTo(0,y)})()`);
		const c = await new Clip(p, 'gallery').start();
		await c.hold(500);
		await c.tap({ sel: 'button', aria: 'View image of MAGNA' }, { pre: 250 });
		await c.hold(700);
		await c.tap({ sel: 'button', aria: 'Next image' }, { pre: 200 });
		await c.hold(600);
		await c.tap({ sel: 'button', aria: 'Next image' }, { pre: 200 });
		await c.hold(900);
		await c.end();
	},

	// lists, then one of the kids
	async lists() {
		const p = await openAs('carla', { url: base + '/lists' });
		const c = await new Clip(p, 'lists').start();
		await c.hold(1200);
		c.mark('tap');
		await c.tap({ sel: 'main button', has: 'Lily' }, { pre: 260 });
		await c.hold(700);
		await c.scrollBy(420, 1300);
		await c.hold(500);
		await c.end();
	},

	// groups -> group -> person
	async groups() {
		const p = await openAs('carla', { url: base + '/groups' });
		const c = await new Clip(p, 'groups').start();
		await c.hold(900);
		await c.tap({ sel: 'main button', has: 'Holiday Gift Exchange' }, { pre: 240 });
		await c.hold(700);
		c.mark('members');
		await c.scrollBy(2100, 2400);
		await c.hold(300);
		c.mark('back');
		await c.scrollBy(-1780, 1100);
		await c.hold(200);
		await c.tap({ sel: 'main button', has: 'Ben Novak' }, { pre: 240 });
		c.mark('ben');
		await c.hold(1000);
		await c.end();
	},

	// claim: available -> planned -> purchased
	async claim() {
		const p = await openAs('carla', { url: `${base}/groups/${G1}/${BEN}` });
		await p.eval(`(()=>{const e=[...document.querySelectorAll('p')].find(b=>b.innerText.startsWith('Ooni Koda'));let c=e;while(!c.querySelector('button[aria-label^="Mark as"]'))c=c.parentElement;c.dataset.promo='oven';const y=c.getBoundingClientRect().top;console.log(y);if(y>420)scrollTo(0,y-300)})()`);
		const c = await new Clip(p, 'claim').start();
		await c.hold(700);
		c.mark('claim1');
		await c.tap({ sel: '[data-promo=oven] button[aria-label="Mark as Planned"]' }, { pre: 260, settle: false });
		await c.hold(180);
		await c.settle(400);
		c.mark('planned');
		await c.hold(1100);
		await c.tap({ sel: '[data-promo=oven] button[aria-label="Mark as Purchased"]' }, { pre: 260, settle: false });
		await c.hold(180);
		await c.settle(400);
		c.mark('purchased');
		await c.hold(1200);
		await c.end();
	},

	// what another group member sees for the same list, and what the owner sees
	async alice() {
		const p = await openAs('alice', { url: `${base}/groups/${G1}/${BEN}` });
		await p.eval(`document.querySelector('[tour-element=group_member_item_filter]').click()`);
		await sleep(500);
		await p.eval(`[...document.querySelectorAll('label')].find(l=>l.innerText.includes('Show Claimed')).click()`);
		await sleep(300);
		await p.s('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
		await p.s('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
		await sleep(700);
		await p.eval(`document.activeElement?.blur()`);
		await p.eval(`(()=>{const e=[...document.querySelectorAll('p')].find(b=>b.innerText.startsWith('Ooni Koda'));scrollTo(0,e.getBoundingClientRect().top+scrollY-150)})()`);
		await sleep(500);
		const c = await new Clip(p, 'alice').start();
		c.box_ = await cardBox(p, 'Ooni Koda');
		await c.hold(300);
		await c.end();
	},
	async ben() {
		const p = await openAs('ben', { url: base + '/items' });
		await p.eval(`(()=>{const e=[...document.querySelectorAll('p')].find(b=>b.innerText.startsWith('Ooni Koda'));scrollTo(0,e.getBoundingClientRect().top+scrollY-110)})()`);
		const c = await new Clip(p, 'ben').start();
		c.box_ = await cardBox(p, 'Ooni Koda');
		await c.hold(300);
		await c.end();
	},

	async shopping() {
		const p = await openAs('carla', { url: base + '/shopping' });
		const c = await new Clip(p, 'shopping').start();
		await c.hold(900);
		await c.scrollBy(260, 900);
		await c.hold(200);
		await c.scrollBy(-260, 600);
		c.mark('toggle');
		await c.tap({ sel: 'label', has: 'Show Purchased' }, { pre: 240 });
		await c.hold(1200);
		await c.end();
	},

	// Secret Santa: draw names with an exclusion
	async santa() {
		const now = new Date();
		const today = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		const target = `${new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'long' })} 19`;
		const p = await openAs('carla', { url: `${base}/groups/${G2}` });
		const c = await new Clip(p, 'santa').start();
		await c.hold(700);
		await c.tap({ text: 'Draw Names' }, { pre: 260 });
		await until(p, `[...document.querySelectorAll('button')].some(b=>b.innerText.trim()==='Christmas')`);
		await c.settle();
		await c.hold(600);
		c.mark('event');
		await c.tap({ text: 'Secret Santa', sel: '[data-slot=dialog-content] button' }, { pre: 260 });
		await c.hold(700);
		c.mark('date');
		await c.tap({ has: today, sel: '[data-slot=dialog-content] button' }, { pre: 200 });
		await c.hold(300);
		await c.tap({ sel: '.rdp-button_next, button[aria-label*="Next Month"], button[name=next-month]' }, { pre: 160 });
		await c.hold(220);
		await c.tap({ has: target, sel: '[role=gridcell] button, td button' }, { pre: 180 });
		await c.hold(350);
		await c.tap({ text: 'Next', sel: '[data-slot=dialog-content] button' }, { pre: 200 });
		await c.hold(700);
		c.mark('exclusions');
		await c.tap({ has: 'No exclusions', nth: 0, sel: '[data-slot=dialog-content] button' }, { pre: 260 });
		await c.hold(450);
		await c.tap({ sel: '[cmdk-item]', has: 'Jack' }, { pre: 200 });
		await c.hold(160);
		await c.tap({ sel: '[cmdk-item]', has: 'Lily' }, { pre: 200 });
		await c.hold(350);
		await p.s('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
		await p.s('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
		await c.settle();
		await c.hold(500);
		const d = await p.eval(`(()=>{const d=document.querySelector('[data-slot=dialog-content]');return [d.scrollHeight,d.clientHeight]})()`);
		console.log('santa dialog', d);
		if (d[0] > d[1]) await c.scrollBy(d[0] - d[1], 600, '[data-slot=dialog-content]');
		c.mark('draw');
		await c.hold(200);
		await c.tap({ has: 'Draw Names', sel: '[data-slot=dialog-content] button' }, { pre: 260, settle: false });
		await c.hold(350);
		await c.settle(700, 5);
		await until(p, `document.body.innerText.includes("getting a gift for")`);
		await c.settle(500, 3);
		c.mark('result');
		await c.hold(2200);
		await c.end();
	},

	async feed() {
		const p = await openAs('carla', { url: base + '/feed' });
		const c = await new Clip(p, 'feed').start();
		await c.hold(700);
		await c.scrollBy(620, 1500);
		await c.hold(200);
		await c.scrollBy(-620, 700);
		c.mark('filter');
		await c.tap({ sel: 'button', aria: 'Choose what shows' }, { pre: 220 });
		await c.hold(900);
		await c.tap({ sel: 'button[role=switch]', nth: 7 }, { pre: 220 });
		await c.hold(700);
		await c.end();
	},

	// group settings: invite people / join by link
	async invite() {
		const p = await openAs('carla', { url: `${base}/groups/${G2}` });
		await p.eval(`(()=>{ // the address shown is the live site's, not the local dev host
			const fix=()=>{for(const i of document.querySelectorAll('input[disabled]')){if(i.value.startsWith('localhost:3001')){Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,i.value.replace('localhost:3001','giftamizer.com'))}}};
			window.__fix=fix;})()`);
		const c = await new Clip(p, 'invite').start();
		await c.hold(300);
		await c.tap({ sel: '[tour-element=group_settings]' }, { pre: 240 });
		await p.eval('__fix()');
		await c.hold(600);
		c.mark('open');
		await c.scrollBy(150, 900, '[data-slot=dialog-content]');
		await p.eval('__fix()');
		await c.hold(1200);
		await c.end();
	},

	// settings toggles, ending with snowfall
	async settings() {
		const p = await openAs('carla', { url: base + '/account' });
		const y = await p.eval(`(()=>{const h=[...document.querySelectorAll('h2')].find(h=>h.innerText==='Features');const y=h.getBoundingClientRect().top+scrollY-120;scrollTo(0,y);return y})()`);
		const c = await new Clip(p, 'settings').start();
		await c.hold(500);
		const sw = async (label) => {
			const i = await p.eval(`(()=>{const s=[...document.querySelectorAll('button[role=switch]')];return s.findIndex(x=>{let e=x;for(let k=0;k<4;k++){e=e.parentElement;if(e.querySelectorAll('button[role=switch]').length>1)return false;if(e.innerText.includes(${JSON.stringify(label)}))return true}return false})})()`);
			await c.tap({ sel: 'button[role=switch]', nth: i }, { pre: 200, settle: false });
			await c.hold(200);
			await c.settle(300);
		};
		await sw('Trash Can');
		await c.hold(250);
		await sw('Item Archive');
		await c.hold(250);
		c.force = true;
		if (await p.eval(`document.body.innerText.includes('Snow Fall')`)) await sw('Snow Fall');
		else console.log('  note: Snow Fall is only offered November to January, so this take has no snow');
		c.mark('snow');
		await c.hold(3600);
		await c.end();
	},

	// closing shot: items page with snow
	async snow() {
		const p = await openAs('carla', { url: base + '/items' });
		const c = new Clip(p, 'snow');
		c.force = true;
		await c.start();
		await c.hold(300);
		await c.scrollBy(500, 3000);
		await c.hold(700);
		await c.end();
	},
};

for (const k of only) {
	const t = Date.now();
	try {
		await clips[k]();
		console.log('  took', ((Date.now() - t) / 1000).toFixed(0) + 's');
	} catch (e) {
		console.log('FAILED', k, e.message);
		process.exitCode = 1;
	}
}
await done();
process.exit(process.exitCode ?? 0);
