import { Link } from 'react-router-dom';

export default function Copyright() {
	return (
		<footer className='flex flex-col items-center gap-2 py-6 text-sm text-muted-foreground'>
			<p>
				{'Copyright © '}
				<Link to='/' className='transition-colors hover:text-foreground'>
					Giftamizer
				</Link>{' '}
				{new Date().getFullYear()}
				{'.'}
			</p>

			<p className='flex items-center gap-2'>
				<Link to='/terms' className='transition-colors hover:text-foreground'>
					Terms
				</Link>
				{'-'}
				<Link to='/policy' className='transition-colors hover:text-foreground'>
					Policy
				</Link>
				{'-'}
				<a href='https://github.com/ExplodedCode/Giftamizer/issues' target='_blank' rel='noreferrer' className='transition-colors hover:text-foreground'>
					Support
				</a>
			</p>
		</footer>
	);
}
