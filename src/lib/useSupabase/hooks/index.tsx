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

	return domain.replace('www.', '');
}

export function FakeDelay(time: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, time);
	});
}
