import React from 'react';

import { Link } from 'react-router-dom';
import { Baby, ClipboardList, ListChecks, ShoppingCart, Shuffle, Sparkles, Users } from 'lucide-react';

import Copyright from './Copyright';
import { GiftIcon } from '../components/SvgIcons';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { cn } from '../lib/utils';

function FeatureCard({ icon, iconClass, title, description }: { icon: React.ReactNode; iconClass: string; title: string; description: string }) {
	return (
		<Card className='flex items-start gap-4 p-5 transition-shadow hover:shadow-md'>
			<span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5', iconClass)}>{icon}</span>
			<div className='flex flex-col gap-1'>
				<p className='font-semibold'>{title}</p>
				<p className='text-sm text-muted-foreground'>{description}</p>
			</div>
		</Card>
	);
}

function Landing() {
	return (
		<div className='min-h-dvh bg-background'>
			{/* Top nav */}
			<header className='sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm'>
				<div className='mx-auto flex h-16 max-w-6xl items-center justify-between px-4'>
					<Link to='/' className='flex items-center gap-2'>
						<GiftIcon className='size-7 text-primary' />
						<span className='text-xl font-semibold tracking-tight'>Giftamizer</span>
					</Link>
					<div className='flex items-center gap-2'>
						<Button variant='ghost' asChild>
							<Link to='/signin'>Sign In</Link>
						</Button>
						<Button asChild>
							<Link to='/signup'>Get Started</Link>
						</Button>
					</div>
				</div>
			</header>

			{/* Hero */}
			<section className='relative overflow-hidden'>
				<div className='pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent' />
				<div className='relative mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-2 md:py-24'>
					<div className='flex flex-col items-start justify-center gap-5'>
						<span className='inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary'>
							<Sparkles className='size-3.5' />
							Your personal gift registry
						</span>
						<h1 className='text-4xl font-bold tracking-tight text-balance md:text-5xl'>
							An easier way to <span className='text-primary'>organize your gifts</span>.
						</h1>
						<p className='max-w-md text-lg text-muted-foreground'>Build your wishlist, share it with friends and family, and never receive a duplicate gift again.</p>
						<div className='mt-2 flex items-center gap-3'>
							<Button size='lg' asChild>
								<Link to='/signup'>Get Started</Link>
							</Button>
							<Button size='lg' variant='outline' asChild>
								<Link to='/signin'>Sign In</Link>
							</Button>
						</div>
					</div>

					<div className='grid content-center gap-4 sm:grid-cols-2'>
						<FeatureCard icon={<GiftIcon />} iconClass='bg-primary/10 text-primary' title='Items' description={`Add anything you'd like to receive.`} />
						<FeatureCard icon={<Users />} iconClass='bg-rose-500/10 text-rose-600 dark:text-rose-400' title='Groups' description='Share your lists with all your friends and family.' />
						<FeatureCard icon={<ClipboardList />} iconClass='bg-sky-500/10 text-sky-600 dark:text-sky-400' title='Lists' description='Create collections of items to share with groups or friends.' />
						<FeatureCard icon={<ShoppingCart />} iconClass='bg-festive/15 text-amber-600 dark:text-festive' title='Shopping List' description='Giftamizer automatically creates your shopping list.' />
					</div>
				</div>
			</section>

			{/* Pitch */}
			<section className='mx-auto max-w-3xl px-4 py-16 text-center'>
				<h2 className='mb-6 text-3xl font-bold tracking-tight'>Giving just got a whole lot better.</h2>
				<p className='text-muted-foreground'>
					Want to receive gifts that you know you will love? Giftamizer is the perfect answer. It's your very own personal gift registry. Whether you're online or in-store, you can add
					anything you'd like to receive - from your favourite bottle of wine or perfect pair of shoes to a new mountain bike or weekend away. Share with your friends or family and invite
					them to share with you!
				</p>
			</section>

			{/* Features */}
			<section className='mx-auto max-w-6xl px-4 pb-20'>
				<h2 className='mb-2 text-center text-2xl font-bold tracking-tight'>Features</h2>
				<div className='mx-auto mb-8 h-px w-24 bg-primary' />
				<div className='grid gap-4 md:grid-cols-2'>
					<FeatureCard
						icon={<Sparkles />}
						iconClass='bg-primary/10 text-primary'
						title='Easily Add Gifts'
						description='Just copy-paste a link to automatically import the item details straight into Giftamizer.'
					/>
					<FeatureCard
						icon={<Shuffle />}
						iconClass='bg-rose-500/10 text-rose-600 dark:text-rose-400'
						title='Secret Santa'
						description={`Draw names for your Secret Santa gift exchange! Even add exclusions for who shouldn't draw whom.`}
					/>
					<FeatureCard
						icon={<ListChecks />}
						iconClass='bg-sky-500/10 text-sky-600 dark:text-sky-400'
						title='Planning'
						description='Your family and friends can mark gifts as reserved. No more accidental duplicate gifts.'
					/>
					<FeatureCard
						icon={<Baby />}
						iconClass='bg-festive/15 text-amber-600 dark:text-festive'
						title='Do you have kids?'
						description='No need to create multiple accounts for your children or pets. Manage them all directly from one account.'
					/>
				</div>
			</section>

			<div className='border-t border-border'>
				<Copyright />
			</div>
		</div>
	);
}

export default Landing;
