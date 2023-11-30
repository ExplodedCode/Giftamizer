import * as React from 'react';
import moment from 'moment';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

import { Box, Button, Checkbox, Grid, Grow, List, ListItem, ListItemIcon, Paper, Slider, Stack, Step, StepContent, StepLabel, Stepper, TextField, Typography } from '@mui/material';
import { LocalizationProvider, MobileDatePicker } from '@mui/x-date-pickers';

import { Member, SecretSantaDrawings } from '../lib/useSupabase/types';
import SecretSantaExclusionSelector from './SecretSantaExclusionSelector';
import { secretSantaMatch } from '../lib/useSupabase';

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

	const [giftCount, setGiftCount] = React.useState<number>(1);

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

	const handleReset = () => {
		setActiveStep(0);
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
			setDrawing(secretSantaMatch(generateRules(), giftCount));
			setAllowCreate(true && eventName.length > 0 && event.length > 0);
			setTooManyExclusions(null);
		} catch (error) {
			console.log(error);
			setAllowCreate(false);
			setTooManyExclusions(String(error).split(' -- ')?.[1] ?? null);
		}
	}, [activeStep, giftCount, exclusions, excludedMembers, members, setAllowCreate, setDrawing, eventName.length, event.length]);

	const events = ['Secret Santa', 'Christmas', 'Hanukkah', 'Thanksgiving', "New Year's Eve", 'Other'];
	const steps = [
		{
			label: 'Event Details',
			content: (
				<>
					<Typography>What do you want to draw names for?</Typography>
					<Stack direction='row' spacing={1} useFlexGap flexWrap='wrap' sx={{ mt: 1, mb: 2 }}>
						{events.map((e) => (
							<Button variant={event === e ? 'contained' : 'outlined'} onClick={() => handleEventSelect(e)}>
								{e}
							</Button>
						))}
					</Stack>
					{event.length > 0 && (
						<Grow in={event.length > 0}>
							<Grid container spacing={2}>
								<Grid item xs={12}>
									<TextField fullWidth label='Event Name' variant='outlined' value={eventName} onChange={(e) => setEventName(e.target.value)} />
								</Grid>
								<Grid item xs={12}>
									<MobileDatePicker slotProps={{ textField: { fullWidth: true } }} label='Event Date' value={eventDate} onChange={(e) => setEventDate(e)} />
								</Grid>
								{/* <Grid item xs={12}>
									<Box>
										<Typography id='track-false-slider'>Number of Gifts Per Person</Typography>
										<Slider value={giftCount} onChange={(e, v) => setGiftCount(v as number)} valueLabelDisplay='auto' step={1} marks min={1} max={members.length - 2} />
									</Box>
								</Grid> */}
							</Grid>
						</Grow>
					)}
				</>
			),
			allowNext: eventName.length > 0 && event.length > 0,
		},
		{
			label: 'Exclusions',
			content: (
				<>
					<Typography>
						An exclusion indicates who may <u>not</u> draw whom.
					</Typography>

					{members.length > 3 ? (
						<Box>
							<List sx={{ width: '100%' }} dense>
								{members.map((member) => (
									<>
										<ListItem sx={{ pl: 0, pr: 0 }}>
											<ListItemIcon sx={{ minWidth: 45 }}>
												<Checkbox
													checked={excludedMembers.find((m) => m?.user_id === member?.user_id) === undefined}
													onChange={(e) => {
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
											</ListItemIcon>
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
										</ListItem>
									</>
								))}
							</List>

							{tooManyExclusions && (
								<Box sx={{ color: 'error.main' }}>
									<b>
										Too many exclusions have been set for
										{(() => {
											let member = members.find((m) => m.user_id === tooManyExclusions);
											let name = `${member?.profile.first_name} ${member?.profile.last_name}`;
											return ` ${name.trim()}`;
										})()}
										! Delete an exclusion.
									</b>
								</Box>
							)}
						</Box>
					) : (
						<Box sx={{ color: 'warning.main' }}>
							<b>Your group is too small for exclusions.</b>
						</Box>
					)}
				</>
			),
			allowNext: !tooManyExclusions,
		},
	];

	return (
		<LocalizationProvider dateAdapter={AdapterMoment}>
			<Box>
				<Stepper activeStep={activeStep} orientation='vertical'>
					{steps.map((step, index) => (
						<Step key={step.label}>
							<StepLabel>{step.label}</StepLabel>
							<StepContent>
								{step.content}
								<Box sx={{ mb: 2 }}>
									<div>
										{index !== 0 && (
											<Button color='inherit' onClick={handleBack} sx={{ mt: 1, mr: 1 }}>
												Back
											</Button>
										)}

										{index !== steps.length - 1 && (
											<Button variant='contained' onClick={handleNext} sx={{ mt: 1, mr: 1 }} disabled={!step.allowNext}>
												{index === steps.length - 1 ? 'Finish' : 'Next'}
											</Button>
										)}
									</div>
								</Box>
							</StepContent>
						</Step>
					))}
				</Stepper>
				{activeStep === steps.length && (
					<Paper square elevation={0} sx={{ p: 3 }}>
						<Typography>All steps completed - you're finished</Typography>
						<Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
							Reset
						</Button>
					</Paper>
				)}
			</Box>
		</LocalizationProvider>
	);
}
