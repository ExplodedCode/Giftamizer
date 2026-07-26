import React from 'react';
import { useSnackbar } from 'notistack';

import {
	Container,
	Typography,
	Box,
	CircularProgress,
	AppBar,
	Breadcrumbs,
	Toolbar,
	FormControlLabel,
	DialogContent,
	useTheme,
	Stack,
	Chip,
	useMediaQuery,
	Fab,
	Button,
	Dialog,
	DialogContentText,
	DialogTitle,
	FormControl,
	TextField,
	Paper,
	RadioGroup,
	Radio,
} from '@mui/material';
import Grid from '@mui/material/Grid';

import { useLocation, useNavigate } from 'react-router-dom';
import { useCreateIssue, useGetIssues } from '../lib/useSupabase/hooks/useSupport';
import { ButtonBase } from '@mui/material';
import { Add } from '@mui/icons-material';
import MUIRichTextEditor from '../components/src/MUIRichTextEditor';
import { convertToRaw } from 'draft-js';
import draftToMarkdown from '../components/src/MUIRichTextEditor/draft-to-markdown';
import { useGetProfile } from '../lib/useSupabase';
export default function ShoppingList() {
	const theme = useTheme();
	const navigate = useNavigate();
	const location = useLocation();
	const { enqueueSnackbar } = useSnackbar();

	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const { data: issues, isLoading } = useGetIssues();
	const { data: profile } = useGetProfile();

	const createIssue = useCreateIssue();

	const open = location.hash === '#new-issue';

	const [type, setType] = React.useState<'issue' | 'request' | 'question'>('issue');
	const [title, setTitle] = React.useState('');
	const [body, setBody] = React.useState('');

	const handleCreate = async () => {
		const label = type === 'issue' ? 'bug' : type === 'request' ? 'enhancement' : 'question';

		await createIssue
			.mutateAsync({
				title: title.trim(),
				body: `<!-- createdBy("${profile?.first_name} ${profile?.last_name}") -->\n<!-- createdByID("${profile?.user_id}") -->\n${body.trim()}`,
				labels: [label],
			})
			.then(() => {
				handleClose();
			})
			.catch((err) => {
				enqueueSnackbar(`Unable to create issue! ${err.message}`, { variant: 'error' });
			});
	};

	const handleClose = async () => {
		setType('issue');
		setTitle('');
		setBody('');

		navigate('#'); // close dialog
	};

	const getCreatedBy = (issue: any) => {
		try {
			return issue.body.match(/createdBy\("(.+?)"\)/)?.[1] || issue?.user?.login || 'unknown';
		} catch {
			return issue?.user?.login || 'unknown';
		}
	};

	return (
		<>
			<AppBar position='static' sx={{ marginBottom: 2 }} color='default'>
				<Toolbar variant='dense'>
					<Breadcrumbs aria-label='breadcrumb' sx={{ flexGrow: 1 }}>
						<Typography color='text.primary'>Support</Typography>
					</Breadcrumbs>
				</Toolbar>
			</AppBar>

			<Container sx={{ pt: 2, pb: 12 }}>
				<Box sx={{ mt: 2, mb: 4, textAlign: 'center', width: '100%' }}>
					<Typography variant='h5' gutterBottom>
						Issues and Requests
					</Typography>
					<Typography variant='body1' gutterBottom>
						If you're experiencing any issues, have feature requests or just have a question, please create a new issue below.
					</Typography>
				</Box>

				<Grid container spacing={1}>
					{issues?.map((issue, index) => (
						<Grid size={12} key={issue.id}>
							<ButtonBase sx={{ width: '100%', textAlign: 'left', borderRadius: 2, display: 'block' }} href={issue.html_url} target='_blank'>
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										background: theme.palette.background.paper,
										border: `1px solid ${theme.palette.divider}`,
										borderRadius: 2,
										p: 2,
										boxShadow: 1,
									}}
								>
									<Box sx={{ mr: 2 }}>
										<Box
											sx={{
												width: 16,
												height: 16,
												borderRadius: '50%',
												backgroundColor: theme.palette.success.main,
												display: 'inline-block',
												mr: 1,
											}}
										/>
									</Box>
									<Box sx={{ flexGrow: 1 }}>
										<Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
											{issue.title}
										</Typography>
										<Typography variant='body2' color='text.secondary'>
											#{issue.number} · {getCreatedBy(issue)} opened on {new Date(issue.created_at).toLocaleDateString()}
										</Typography>
									</Box>
									{!isMobile && (
										<Box>
											<Stack direction='row' spacing={1}>
												{issue.labels.map((label: any) => (
													<Chip key={label.id} label={label.name} sx={{ color: `#${label.color}`, borderColor: `#${label.color}` }} size='small' variant='outlined' />
												))}
											</Stack>
										</Box>
									)}
								</Box>
							</ButtonBase>
						</Grid>
					))}

					{issues?.length === 0 && (
						<Box style={{ marginTop: 100, textAlign: 'center', width: '100%' }}>
							<Typography variant='h5' gutterBottom>
								No open issues!
							</Typography>
						</Box>
					)}
				</Grid>

				{isLoading && (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 16 }}>
						<CircularProgress />
					</Box>
				)}
			</Container>

			<Fab color='primary' aria-label='add' onClick={() => navigate('#new-issue')} sx={{ position: 'fixed', bottom: { xs: 64, md: 16 }, right: { xs: 8, md: 16 } }}>
				<Add />
			</Fab>

			<Dialog open={open} onClose={() => (createIssue.isLoading ? undefined : handleClose())} maxWidth='md' fullScreen={useMediaQuery(theme.breakpoints.down('md'))}>
				<DialogTitle>Create Issues or Requests</DialogTitle>
				<DialogContent>
					<Grid container spacing={2}>
						<Grid size={12}>
							<DialogContentText>Please provide a title and description for your issue or request.</DialogContentText>
						</Grid>
						<Grid size={{ xs: 12, sm: 6 }}>
							<FormControl component='fieldset' fullWidth>
								<RadioGroup row name='issueType' value={type} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setType(e.target.value as 'issue' | 'request')}>
									<FormControlLabel value='issue' control={<Radio />} label='Issue' />
									<FormControlLabel value='request' control={<Radio />} label='Request' />
									<FormControlLabel value='question' control={<Radio />} label='Question' />
								</RadioGroup>
							</FormControl>
						</Grid>
						<Grid size={12}>
							<TextField fullWidth label='Title' variant='outlined' required value={title} onChange={(e) => setTitle(e.target.value)} disabled={createIssue.isLoading} />
						</Grid>
						<Grid size={12}>
							<Paper variant='elevation' elevation={2} sx={{ px: 1 }}>
								<MUIRichTextEditor
									label='Description...'
									onChange={(e: any) => {
										const markdown = draftToMarkdown(convertToRaw(e.getCurrentContent()), {}).trim();
										console.log(markdown);
										setBody(markdown);
									}}
								/>
							</Paper>
						</Grid>
						<Grid size={12}>
							<Stack direction='row' spacing={2} sx={{ justifyContent: 'flex-end' }}>
								<Button color='inherit' onClick={handleClose} disabled={createIssue.isLoading}>
									Cancel
								</Button>

								<Button
									onClick={handleCreate}
									disabled={title.trim().length === 0 || body.trim().length === 0}
									endIcon={<Add />}
									loading={createIssue.isLoading}
									loadingPosition='end'
									variant='contained'
								>
									Create
								</Button>
							</Stack>
						</Grid>
					</Grid>
				</DialogContent>
			</Dialog>
		</>
	);
}
