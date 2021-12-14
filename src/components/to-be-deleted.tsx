import { supabase } from '../lib/api';
import { User } from '@supabase/supabase-js';

import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
	children: JSX.Element;
	user: User | undefined;
}

const PrivateRoutes = (props: PrivateRouteProps) => {
	//const { data, error } = await supabase.auth.getSession();

	console.log('private', props.user);

	return props.user ? props.children : <Navigate to='/signin' />;
};

export default PrivateRoutes;
