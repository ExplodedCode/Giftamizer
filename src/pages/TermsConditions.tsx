import React from 'react';

import { Link } from 'react-router-dom';

import Copyright from './Copyright';
import { GiftIcon } from '../components/SvgIcons';
import { Button } from '../components/ui/button';

function TermsConditions() {
	return (
		<div className='min-h-dvh bg-background'>
			<header className='sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm'>
				<div className='mx-auto flex h-16 max-w-4xl items-center justify-between px-4'>
					<Link to='/' className='flex items-center gap-2'>
						<GiftIcon className='size-7 text-primary' />
						<span className='text-xl font-semibold tracking-tight'>Giftamizer</span>
					</Link>
					<Button variant='ghost' asChild>
						<Link to='/signin'>Sign In</Link>
					</Button>
				</div>
			</header>

			<div className='mx-auto max-w-4xl px-4 pt-8 pb-16 text-sm leading-relaxed [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_li]:my-1 [&_p]:my-3 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6'>
				<h1 className='mb-4 text-2xl font-bold tracking-tight'>Terms &amp; Conditions</h1>
				<p>
					By downloading or using the app, these terms will automatically apply to you – you should make sure therefore that you read them carefully before using the app. You’re not allowed
					to copy, or modify the app, any part of the app, or our trademarks in any way. You’re not allowed to attempt to extract the source code of the app, and you also shouldn’t try to
					translate the app into other languages, or make derivative versions. The app itself, and all the trade marks, copyright, database rights and other intellectual property rights
					related to it, still belong to Evan Trowbridge.
				</p>
				<p>
					Evan Trowbridge is committed to ensuring that the app is as useful and efficient as possible. For that reason, we reserve the right to make changes to the app or to charge for its
					services, at any time and for any reason. We will never charge you for the app or its services without making it very clear to you exactly what you’re paying for.
				</p>
				<p>
					The Giftamizer app stores and processes personal data that you have provided to us, in order to provide my Service. It’s your responsibility to keep your phone and access to the
					app secure. We therefore recommend that you do not jailbreak or root your phone, which is the process of removing software restrictions and limitations imposed by the official
					operating system of your device. It could make your phone vulnerable to malware/viruses/malicious programs, compromise your phone’s security features and it could mean that the
					Giftamizer app won’t work properly or at all.
				</p>
				<div>
					<p>The app does use third party services that declare their own Terms and Conditions.</p> <p>Link to Terms and Conditions of third party service providers used by the app</p>
					<ul>
						<li>
							<a href='https://policies.google.com/terms' target='_blank' rel='noopener noreferrer'>
								Google Play Services
							</a>
						</li>
					</ul>
				</div>
				<p>
					You should be aware that there are certain things that Evan Trowbridge will not take responsibility for. Certain functions of the app will require the app to have an active
					internet connection. The connection can be Wi-Fi, or provided by your mobile network provider, but Evan Trowbridge cannot take responsibility for the app not working at full
					functionality if you don’t have access to Wi-Fi, and you don’t have any of your data allowance left.
				</p>
				<p></p>
				<p>
					If you’re using the app outside of an area with Wi-Fi, you should remember that your terms of the agreement with your mobile network provider will still apply. As a result, you may
					be charged by your mobile provider for the cost of data for the duration of the connection while accessing the app, or other third party charges. In using the app, you’re accepting
					responsibility for any such charges, including roaming data charges if you use the app outside of your home territory (i.e. region or country) without turning off data roaming. If
					you are not the bill payer for the device on which you’re using the app, please be aware that we assume that you have received permission from the bill payer for using the app.
				</p>
				<p>
					Along the same lines, Evan Trowbridge cannot always take responsibility for the way you use the app i.e. You need to make sure that your device stays charged – if it runs out of
					battery and you can’t turn it on to avail the Service, Evan Trowbridge cannot accept responsibility.
				</p>
				<p>
					With respect to Evan Trowbridge’s responsibility for your use of the app, when you’re using the app, it’s important to bear in mind that although we endeavour to ensure that it is
					updated and correct at all times, we do rely on third parties to provide information to us so that we can make it available to you. Evan Trowbridge accepts no liability for any
					loss, direct or indirect, you experience as a result of relying wholly on this functionality of the app.
				</p>
				<p>
					At some point, we may wish to update the app. The app is currently available on Android – the requirements for system(and for any additional systems we decide to extend the
					availability of the app to) may change, and you’ll need to download the updates if you want to keep using the app. Evan Trowbridge does not promise that it will always update the
					app so that it is relevant to you and/or works with the Android version that you have installed on your device. However, you promise to always accept updates to the application
					when offered to you, We may also wish to stop providing the app, and may terminate use of it at any time without giving notice of termination to you. Unless we tell you otherwise,
					upon any termination, (a) the rights and licenses granted to you in these terms will end; (b) you must stop using the app, and (if needed) delete it from your device.
				</p>
				<p>
					<strong>Changes to This Terms and Conditions</strong>
				</p>
				<p>
					I may update our Terms and Conditions from time to time. Thus, you are advised to review this page periodically for any changes. I will notify you of any changes by posting the new
					Terms and Conditions on this page.
				</p>
				<p>These terms and conditions are effective as of 12/01/2020</p>
				<p>
					<strong>Contact Us</strong>
				</p>
				<p>If you have any questions or suggestions about my Terms and Conditions, do not hesitate to contact me at evan@trowbridge.tech.</p>
			</div>

			<div className='border-t border-border'>
				<Copyright />
			</div>
		</div>
	);
}

export default TermsConditions;
