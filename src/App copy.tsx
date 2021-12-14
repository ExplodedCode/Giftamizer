import Button from '@mui/material/Button';
import { useSnackbar } from 'notistack';
import React from 'react';
import { SnackbarAlert } from './types';

function App() {
	const { closeSnackbar } = useSnackbar();

	React.useEffect(() => {
		window.ReactAPI.emit('alert', {
			text: 'Test toast',
			options: {
				variant: 'success',
				action: (key) => (
					<>
						test: <Button onClick={() => closeSnackbar(key)}>test</Button>
					</>
				),
			},
		} as SnackbarAlert);
	});

	return (
		<div className='App'>
			<header className='App-header'>
				<p>
					Edit <code>src/App.tsx</code> and save to reload.
				</p>
				<a className='App-link' href='https://reactjs.org' target='_blank' rel='noopener noreferrer'>
					Learn React
				</a>
			</header>
		</div>
	);
}

export default App;
