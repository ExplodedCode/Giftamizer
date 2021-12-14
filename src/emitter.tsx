type EventMap = Record<string, any>;

type EventKey<T extends EventMap> = string & keyof T;
type EventReceiver<T> = (params: T) => void;

export interface IEmitter<T extends EventMap> {
	on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
	off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
	emit<K extends EventKey<T>>(eventName: K, params: T[K]): void;
}

// `listeners` are unbounded -- don't use this in practice!
export function eventEmitter<T extends EventMap>(): IEmitter<T> {
	const listeners: {
		[K in keyof EventMap]?: Array<(p: EventMap[K]) => void>;
	} = {};

	return {
		on(key, fn) {
			listeners[key] = (listeners[key] || []).concat(fn);
		},
		off(key, fn) {
			listeners[key] = (listeners[key] || []).filter((f) => f !== fn);
		},
		emit(key, data) {
			(listeners[key] || []).forEach(function (fn) {
				fn(data);
			});
		},
	};
}
