import { Link } from 'react-router-dom';
import { useSupabase } from '../lib/useSupabase';

export default function NotFound() {
	const { user } = useSupabase();

	return (
		<>
			{user ? (
				<p className='mt-24 text-center text-xl font-medium'>Page not found!</p>
			) : (
				<>
					<p className='mt-24 mb-2 text-center text-xl font-medium'>Page not found!</p>

					<p className='text-center text-sm'>
						<Link to='/groups' className='text-primary underline-offset-4 hover:underline'>
							Go Back
						</Link>
					</p>
				</>
			)}
		</>
	);
}
