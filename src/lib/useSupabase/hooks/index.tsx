export * from './useSupabase';
export * from './useProfile';
export * from './useSystem';
export * from './useItems';
export * from './useLists';
export * from './useGroup';
export * from './useMember';

export function ExtractDomain(url: string) {
	var domain;
	//find & remove protocol (http, ftp, etc.) and get domain
	if (url.indexOf('://') > -1) {
		domain = url.split('/')[2];
	} else {
		domain = url.split('/')[0];
	}

	//find & remove port number
	domain = domain.split(':')[0];

	// amazon short links
	if (domain === 'a.co') domain = 'amazon.com';

	return domain.replace('www.', '');
}

export function StandardizeURL(url: string) {
	if (!url.startsWith('http')) return `http://${url}`;
	return url;
}

export function ExtractURLFromText(text: string) {
	const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;
	return text.match(urlRegex)?.[0] ?? text;
}

export function FakeDelay(time?: number) {
	return new Promise((resolve) => {
		const delay = time ?? Math.floor(Math.random() * (650 - 350 + 1)) + 350;
		setTimeout(resolve, delay);
	});
}
