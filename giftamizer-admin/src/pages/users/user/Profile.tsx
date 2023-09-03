import * as React from 'react';

import { Grid, Typography, FormHelperText, TextField, Divider, FormControl, FormControlLabel, FormGroup, Switch, Paper, useTheme } from '@mui/material';
import { Profile as ProfileType } from '../../../lib/useSupabase';
import ImageCropper from '../../../components/ImageCropper';

type ProfileProps = {
	profile: ProfileType;
};
export default function Profile({ profile }: ProfileProps) {
	const theme = useTheme();

	const [firstName, setFirstName] = React.useState(profile.first_name);
	const [lastName, setLastName] = React.useState(profile.last_name);
	const [image, setImage] = React.useState<string | undefined>(profile.image);
	const [bio, setBio] = React.useState(profile.bio);

	const [enableLists, setEnableLists] = React.useState(profile.enable_lists);
	const [enableArchive, setEnableArchive] = React.useState(profile.enable_archive);
	const [enableTrash, setEnableTrash] = React.useState(profile.enable_trash);

	return (
		<Paper
			sx={{
				maxWidth: 936,
				margin: 'auto',
				overflow: 'hidden',
				padding: 4,
				border: theme.palette.mode === 'light' ? 'unset' : 1,
				borderColor: theme.palette.mode === 'light' ? 'unset' : '#474a53',
			}}
			elevation={3}
		>
			<Grid item xs={12}>
				<ImageCropper value={image} onChange={setImage} aspectRatio={1} />
				<Typography variant='h6' gutterBottom>
					Account Settings
				</Typography>
			</Grid>
			<Grid container spacing={2}>
				<Grid item xs={6}>
					<TextField fullWidth label='First Name' variant='outlined' value={firstName} onChange={(e) => setFirstName(e.target.value)} />
				</Grid>
				<Grid item xs={6}>
					<TextField fullWidth label='Last Name' variant='outlined' value={lastName} onChange={(e) => setLastName(e.target.value)} />
				</Grid>
				<Grid item xs={12}>
					<TextField
						fullWidth
						multiline
						minRows={3}
						maxRows={7}
						label='Bio'
						variant='outlined'
						inputProps={{ maxLength: 250 }}
						value={bio}
						onChange={(e) => setBio(e.target.value)}
						helperText={`${bio.length} / 250`}
					/>
				</Grid>
				<Grid item xs={12}>
					<Divider />
				</Grid>
				<Grid item xs={12}>
					<FormControl component='fieldset' variant='standard'>
						<FormGroup>
							<FormControlLabel control={<Switch checked={enableLists} onChange={(e) => setEnableLists(e.target.checked)} />} label='Enable Lists' />
							<FormHelperText>
								Allows you to create item lists and assign them to groups. <i>Even create seperate managed lists for your kids or pets</i>.
							</FormHelperText>
						</FormGroup>
					</FormControl>
				</Grid>
				<Grid item xs={12}>
					<FormControl component='fieldset' variant='standard'>
						<FormGroup>
							<FormControlLabel control={<Switch checked={enableTrash} onChange={(e) => setEnableTrash(e.target.checked)} />} label='Enable Trash Can' />
							<FormHelperText>Recover deleted items.</FormHelperText>
						</FormGroup>
					</FormControl>
				</Grid>
				<Grid item xs={12}>
					<FormControl component='fieldset' variant='standard'>
						<FormGroup>
							<FormControlLabel control={<Switch checked={enableArchive} onChange={(e) => setEnableArchive(e.target.checked)} />} label='Enable Item Archive' />
						</FormGroup>
					</FormControl>
				</Grid>
			</Grid>
		</Paper>
	);
}
