export * from './useSupabase';
export * from './useStats';
export * from './useUsers';
export * from './useItems';
export * from './useLists';

export function FakeDelay(time?: number) {
	return new Promise((resolve) => {
		const delay = time ?? Math.floor(Math.random() * (650 - 350 + 1)) + 350;
		setTimeout(resolve, delay);
	});
}
