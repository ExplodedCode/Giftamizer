import * as React from 'react';
import moment from 'moment';

import { Member, SecretSantaDrawings } from '../lib/useSupabase/types';
import SecretSantaExclusionSelector from './SecretSantaExclusionSelector';
import { secretSantaMatch } from '../lib/useSupabase';

import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { DatePicker } from './ui/date-picker';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { VerticalStepper } from './ui/stepper';

export interface SecretSantaExclusions {
	user_id: string;
	members: Member[];
}

interface SecretSantaProps {
	members: Member[];
	setAllowCreate: (value: boolean) => void;

	eventName: string;
	setEventName: (value: string) => void;

	eventDate: moment.Moment | null;
	setEventDate: (value: moment.Moment | null) => void;

	setDrawing: (value: SecretSantaDrawings) => void;
}

export default function SecretSantaSetup({ members, setAllowCreate, eventName, setEventName, eventDate, setEventDate, setDrawing }: SecretSantaProps) {
	const [event, setEvent] = React.useState<string>('');

	const [excludedMembers, setExcludedMembers] = React.useState<Member[]>([]);
	const [exclusions, setExclusions] = React.useState<SecretSantaExclusions[]>([]);
	const [tooManyExclusions, setTooManyExclusions] = React.useState<string | null>(null);

	const [activeStep, setActiveStep] = React.useState(0);

	const handleNext = () => {
		setActiveStep((prevActiveStep) => prevActiveStep + 1);
	};

	const handleBack = () => {
		setActiveStep((prevActiveStep) => prevActiveStep - 1);
	};

	const handleEventSelect = (selection: string) => {
		setEvent(event.startsWith(selection) ? '' : selection);
		if (selection === 'Other') setEventName('');
		else setEventName(`${selection} ${moment().format('YYYY')}`);
	};

	React.useEffect(() => {
		let newExclusions: SecretSantaExclusions[] = [];
		exclusions.forEach((exclusion) => {
			newExclusions.push({
				user_id: exclusion.user_id,
				members: exclusion.members.filter((m) => excludedMembers.find((em) => em.user_id === m.user_id) === undefined),
			});
		});

		setExclusions(newExclusions.filter((e) => excludedMembers.find((em) => em.user_id === e.user_id) === undefined));
	}, [excludedMembers, exclusions]);

	React.useEffect(() => {
		const generateRules = () => {
			let rules: any = {};

			members
				.filter((m) => excludedMembers.find((em) => em.user_id === m.user_id) === undefined)
				.forEach((member) => {
					if (exclusions.find((exclusion) => exclusion.user_id === member.user_id)) {
						rules[member.user_id] = {
							exclude: exclusions.find((exclusion) => exclusion.user_id === member.user_id)!.members.map((m) => m.user_id),
						};
					} else {
						rules[member.user_id] = null;
					}
				});

			return rules;
		};

		try {
			setDrawing(secretSantaMatch(generateRules(), 1));
			setAllowCreate(true && eventName.length > 0 && event.length > 0);
			setTooManyExclusions(null);
		} catch (error) {
			console.log(error);
			setAllowCreate(false);
			setTooManyExclusions(String(error).split(' -- ')?.[1] ?? null);
		}
	}, [activeStep, exclusions, excludedMembers, members, setAllowCreate, setDrawing, eventName.length, event.length]);

	const events = ['Secret Santa', 'Christmas', 'Hanukkah', 'Thanksgiving', "New Year's Eve", 'Other'];
	const steps = [
		{
			label: 'Event Details',
			allowNext: eventName.length > 0 && event.length > 0,
			content: (
				<div className='flex flex-col gap-3'>
					<p className='text-sm'>What do you want to draw names for?</p>
					<div className='flex flex-wrap gap-1.5'>
						{events.map((e) => (
							<Button key={e} variant={event === e ? 'default' : 'outline'} size='sm' onClick={() => handleEventSelect(e)}>
								{e}
							</Button>
						))}
					</div>
					{event.length > 0 && (
						<div className='flex animate-in flex-col gap-3 fade-in zoom-in-95'>
							<FormField label='Event Name'>
								<Input value={eventName} onChange={(e) => setEventName(e.target.value)} />
							</FormField>
							<FormField label='Event Date'>
								<DatePicker value={eventDate?.toDate()} onChange={(date) => setEventDate(date ? moment(date) : null)} />
							</FormField>
						</div>
					)}
				</div>
			),
		},
		{
			label: 'Exclusions',
			allowNext: !tooManyExclusions,
			content: (
				<div className='flex flex-col gap-3'>
					<p className='text-sm'>
						An exclusion indicates who may <u>not</u> draw whom.
					</p>

					{members.length > 3 ? (
						<div className='flex flex-col gap-3'>
							{members.map((member) => (
								<div key={member.user_id} className='flex items-center gap-3'>
									<Checkbox
										checked={excludedMembers.find((m) => m?.user_id === member?.user_id) === undefined}
										onCheckedChange={() => {
											if (excludedMembers.find((m) => m?.user_id === member?.user_id) !== undefined) {
												setExcludedMembers(excludedMembers.filter((m) => m.user_id !== member.user_id));
											} else {
												setExcludedMembers([...excludedMembers, member]);
											}
										}}
										disabled={
											excludedMembers.find((m) => m?.user_id === member?.user_id) === undefined &&
											members.filter((m) => m?.user_id !== member?.user_id && excludedMembers.find((em) => em.user_id === m.user_id) === undefined).length < 3
										}
									/>
									<div className='min-w-0 flex-1'>
										<SecretSantaExclusionSelector
											member={member}
											members={members.filter((m) => m?.user_id !== member?.user_id && excludedMembers.find((em) => em.user_id === m.user_id) === undefined)}
											value={exclusions.find((e) => e.user_id === member.user_id)!}
											onChange={(e) => {
												if (exclusions.find((exclusion) => exclusion.user_id === member.user_id)) {
													setExclusions((prev) => prev.map((exclusion) => (exclusion.user_id === member.user_id ? e : exclusion)));
												} else {
													setExclusions([...exclusions, e]);
												}
											}}
											disabled={excludedMembers.find((m) => m?.user_id === member?.user_id) !== undefined}
										/>
									</div>
								</div>
							))}

							{tooManyExclusions && (
								<p className='text-sm font-bold text-destructive'>
									Too many exclusions have been set for
									{(() => {
										let member = members.find((m) => m.user_id === tooManyExclusions);
										let name = `${member?.profile.first_name} ${member?.profile.last_name}`;
										return ` ${name.trim()}`;
									})()}
									! Delete an exclusion.
								</p>
							)}
						</div>
					) : (
						<p className='text-sm font-bold text-status-planned'>Your group is too small for exclusions.</p>
					)}
				</div>
			),
		},
	];

	return (
		<VerticalStepper
			activeStep={activeStep}
			steps={steps.map((step, index) => ({
				label: step.label,
				content: (
					<div className='flex flex-col gap-3'>
						{step.content}
						<div className='flex gap-2'>
							{index !== 0 && (
								<Button variant='ghost' size='sm' onClick={handleBack}>
									Back
								</Button>
							)}

							{index !== steps.length - 1 && (
								<Button size='sm' onClick={handleNext} disabled={!step.allowNext}>
									{index === steps.length - 1 ? 'Finish' : 'Next'}
								</Button>
							)}
						</div>
					</div>
				),
			}))}
		/>
	);
}
