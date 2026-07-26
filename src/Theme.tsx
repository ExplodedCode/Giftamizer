import { BrowserRouter as Router } from 'react-router-dom';

import Routes from './Routes';
import DevAccountSwitcher from './components/DevAccountSwitcher';

export default function App() {
	return (
		<Router>
			<DevAccountSwitcher />
			<Routes />
		</Router>
	);
}
