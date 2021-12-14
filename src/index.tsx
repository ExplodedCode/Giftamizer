import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';

import { SnackbarProvider } from 'notistack';

import { eventEmitter } from './emitter';
import Theme from './Theme';

const emitter = eventEmitter<{
	data: Buffer | string;
	end: undefined;
}>();

window.ReactAPI = emitter;

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
	<React.StrictMode>
		<SnackbarProvider maxSnack={3}>
			<Theme />
		</SnackbarProvider>
	</React.StrictMode>
);

reportWebVitals();
