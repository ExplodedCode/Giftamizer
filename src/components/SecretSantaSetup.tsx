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
	/** Must be a stable callback (a `useState` setter) — it is used inside effects. */
	setAllowCreate: (value: boolean) => void;

	eventName: string;
	setEventName: (value: string) => void;

	eventDate: moment.Moment | null;
	setEventDate: (value: moment.Moment | null) => void;

	/** Must be a stable callback (a `useState` setter) — it is used inside effects. */
	setDrawing: (value: SecretSantaDrawings) => void;
}

export default function SecretSantaSetup({ members, setAllowCreate, eventName, setEventName, eventDate, setEventDate, setDrawing }: SecretSantaProps) {
	const [event, setEvent] = React.useState<string>('');

	const [excludedMembers, setExcludedMembers] = React.useState<Member[]>([]);
	const [exclusions, setExclusions] = React.useState<SecretSantaExclusions[]>([]);
	const [tooManyExclusions, setTooManyExclusions] = React.useState<string | null>(null);
	const [drawingReady, setDrawingReady] = React.useState<boolean>(false);

	const [activeStep, setActiveStep] = React.useState(0);

	const handleNext = () => {
		setActiveStep((prevActiveStep) => prevActiveStep + 1);
	};

	const handleBack = () => {
		setActiveStep((prevActiveStep) => prevActiveStep - 1);
	};

	const handleEventSelect = (selection: string) => {
		const deselecting = event === selection;

		setEvent(deselecting ? '' : selection);
		if (deselecting || selection === 'Other') setEventName('');
		else setEventName(`${selection} ${moment().format('YYYY')}`);
	};

	// The parent re-creates the member array on every render, so anything derived
	// from it has to be keyed on the member ids rather than the array identity.
	const validMembers = React.useMemo(() => members.filter((m): m is Member => Boolean(m?.user_id)), [members]);

	// Drop exclusions that belong to — or point at — a member who is no longer in
	// the drawing. Returns the previous state when nothing changed so this can
	// never re-trigger itself.
	React.useEffect(() => {
		setExclusions((prev) => {
			const next = prev
				.filter((e) => !excludedMembers.some((em) => em.user_id === e.user_id))
				.map((e) => {
					const remaining = e.members.filter((m) => !excludedMembers.some((em) => em.user_id === m.user_id));
					return remaining.length === e.members.length ? e : { ...e, members: remaining };
				});

			const unchanged = next.length === prev.length && next.every((e, i) => e === prev[i]);
			return unchanged ? prev : next;
		});
	}, [excludedMembers]);

	const activeMembers = React.useMemo(
		() => validMembers.filter((m) => excludedMembers.find((em) => em.user_id === m.user_id) === undefined),
		[validMembers, excludedMembers]
	);

	// Serialized so the (random, expensive) match only re-runs when the rules
	// themselves change — not on every render of the dialog.
	const rulesKey = React.useMemo(() => {
		let rules: { [user_id: string]: { exclude: string[] } | null } = {};

		activeMembers.forEach((member) => {
			const exclusion = exclusions.find((e) => e.user_id === member.user_id);
			rules[member.user_id] = exclusion ? { exclude: exclusion.members.map((m) => m.user_id) } : null;
		});

		return JSON.stringify(rules);
	}, [activeMembers, exclusions]);

	React.useEffect(() => {
		try {
			setDrawing(secretSantaMatch(JSON.parse(rulesKey), 1));
			setDrawingReady(true);
			setTooManyExclusions(null);
		} catch (error) {
			console.error(error);
			setDrawingReady(false);
			setTooManyExclusions(String(error).split(' -- ')?.[1] ?? null);
		}
	}, [rulesKey, setDrawing]);

	React.useEffect(() => {
		setAllowCreate(drawingReady && eventName.trim().length > 0 && event.length > 0);
	}, [setAllowCreate, drawingReady, eventName, event]);

	const events = ['Secret Santa', 'Christmas', 'Hanukkah', 'Thanksgiving', "New Year's Eve", 'Other'];
	const steps = [
		{
			label: 'Event Details',
			allowNext: eventName.trim().length > 0 && event.length > 0,
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
			allowNext: drawingReady,
			content: (
				<div className='flex flex-col gap-3'>
					<p className='text-sm'>
						An exclusion indicates who may <u>not</u> draw whom.
					</p>

					{validMembers.length > 3 ? (
						<div className='flex flex-col gap-3'>
							{validMembers.map((member) => (
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
											validMembers.filter((m) => m?.user_id !== member?.user_id && excludedMembers.find((em) => em.user_id === m.user_id) === undefined).length < 3
										}
									/>
									<div className='min-w-0 flex-1'>
										<SecretSantaExclusionSelector
											member={member}
											members={validMembers.filter((m) => m?.user_id !== member?.user_id && excludedMembers.find((em) => em.user_id === m.user_id) === undefined)}
											value={exclusions.find((e) => e.user_id === member.user_id)!}
											onChange={(e) => {
												if (exclusions.find((exclusion) => exclusion.user_id === member.user_id)) {
													setExclusions((prev) => prev.map((exclusion) => (exclusion.user_id === member.user_id ? e : exclusion)));
												} else {
													setExclusions((prev) => [...prev, e]);
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
										let member = validMembers.find((m) => m.user_id === tooManyExclusions);
										let name = `${member?.profile.first_name} ${member?.profile.last_name}`;
										return ` ${name.trim()}`;
									})()}
									! Delete an exclusion.
								</p>
							)}

							{!drawingReady && !tooManyExclusions && <p className='text-sm font-bold text-destructive'>Names can't be drawn with these settings. Remove an exclusion or add someone back to the drawing.</p>}
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
									Next
								</Button>
							)}
						</div>
					</div>
				),
			}))}
		/>
	);
}
