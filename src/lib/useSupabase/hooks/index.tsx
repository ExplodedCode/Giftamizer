export * from './useSupabase';
export * from './useProfile';
export * from './useSystem';
export * from './useItems';
export * from './useLists';
export * from './useGroup';
export * from './useMember';

export function ExtractDomain(url: string) {
	url = url.toLocaleLowerCase();
	var domain;
	//find & remove protocol (http, ftp, etc.) and get domain
	if (url.indexOf('://') > -1) {
		domain = url.split('/')[2];
	} else {
		domain = url.split('/')[0];
	}

	// find & remove port number
	domain = domain.split(':')[0];

	// find & other
	domain = domain.split('?')[0];

	// amazon short links
	if (domain === 'a.co' || domain === 'amzn.to') domain = 'amazon.com';

	return domain.replace('www.', '');
}

export function StandardizeURL(url: string) {
	if (!url.startsWith('http')) return `http://${url}`;
	return url;
}

export function ExtractURLFromText(text: string) {
	return text
		.replace(/\n/g, ' ')
		.split(' ')
		.filter((u) => u.startsWith('http'));
}

export function FakeDelay(time?: number) {
	return new Promise((resolve) => {
		const delay = time ?? Math.floor(Math.random() * (650 - 350 + 1)) + 350;
		setTimeout(resolve, delay);
	});
}
