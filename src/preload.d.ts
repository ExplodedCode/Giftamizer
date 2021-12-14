import { IEmitter } from './emitter';

declare global {
	interface Window {
		ReactAPI: IEmitter;
	}
}
