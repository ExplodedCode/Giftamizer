import React from 'react';
import { useSnackbar } from '../lib/snackbar';

import { useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { useCreateIssue, useGetIssues } from '../lib/useSupabase/hooks/useSupport';
import { useGetProfile } from '../lib/useSupabase';

import RichTextEditor from '../components/RichTextEditor';

import { useMediaQuery } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Chip } from '../components/ui/chip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { FormField } from '../components/ui/form-field';
import { Input } from '../components/ui/input';
import { PageHeader } from '../components/ui/page-header';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Spinner } from '../components/ui/spinner';

export default function Support() {
	const navigate = useNavigate();
	const location = useLocation();
	const { enqueueSnackbar } = useSnackbar();

	const isMobile = useMediaQuery('(max-width: 599.95px)');

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
			<PageHeader crumbs={[{ label: 'Support' }]} />

			<div className='mx-auto max-w-5xl px-4 pt-4 pb-12'>
				<div className='my-6 text-center'>
					<h1 className='mb-1 text-xl font-semibold'>Issues and Requests</h1>
					<p className='text-muted-foreground'>If you're experiencing any issues, have feature requests or just have a question, please create a new issue below.</p>
				</div>

				<div className='flex flex-col gap-2'>
					{issues?.map((issue) => (
						<a
							key={issue.id}
							href={issue.html_url}
							target='_blank'
							rel='noreferrer'
							className='flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-xs transition-shadow outline-none hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring/50'
						>
							<span className='size-4 shrink-0 rounded-full bg-status-available' />

							<span className='flex min-w-0 flex-1 flex-col'>
								<span className='truncate font-semibold'>{issue.title}</span>
								<span className='text-sm text-muted-foreground'>
									#{issue.number} · {getCreatedBy(issue)} opened on {new Date(issue.created_at).toLocaleDateString()}
								</span>
							</span>

							{!isMobile && (
								<span className='flex shrink-0 gap-1.5'>
									{issue.labels.map((label: any) => (
										<Chip key={label.id} size='sm' variant='outline' style={{ color: `#${label.color}`, borderColor: `#${label.color}40` }}>
											{label.name}
										</Chip>
									))}
								</span>
							)}
						</a>
					))}

					{issues?.length === 0 && (
						<div className='mt-24 text-center'>
							<p className='text-xl font-medium'>No open issues!</p>
						</div>
					)}
				</div>

				{isLoading && (
					<div className='mt-32 flex justify-center'>
						<Spinner size={32} />
					</div>
				)}
			</div>

			<button
				type='button'
				aria-label='add'
				onClick={() => navigate('#new-issue')}
				className='fixed right-2 bottom-20 z-30 flex size-14 cursor-pointer items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transition-all outline-none hover:bg-primary-hover hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-95 md:right-4 md:bottom-4'
			>
				<Plus className='size-7' />
			</button>

			<Dialog
				open={open}
				onOpenChange={(next) => {
					if (!next && !createIssue.isLoading) handleClose();
				}}
			>
				<DialogContent size='lg' fullScreenOnMobile dismissible={!createIssue.isLoading}>
					<DialogHeader>
						<DialogTitle>Create Issues or Requests</DialogTitle>
						<DialogDescription>Please provide a title and description for your issue or request.</DialogDescription>
					</DialogHeader>

					<div className='flex flex-col gap-4'>
						<RadioGroup value={type} onValueChange={(value) => setType(value as 'issue' | 'request' | 'question')} className='flex flex-row gap-5'>
							{(['issue', 'request', 'question'] as const).map((option) => (
								<label key={option} className='flex cursor-pointer items-center gap-2 text-sm font-medium capitalize'>
									<RadioGroupItem value={option} />
									{option}
								</label>
							))}
						</RadioGroup>

						<FormField label='Title' required>
							<Input required value={title} onChange={(e) => setTitle(e.target.value)} disabled={createIssue.isLoading} />
						</FormField>

						<RichTextEditor placeholder='Description...' onChangeMarkdown={setBody} />

						<div className='flex justify-end gap-2'>
							<Button variant='ghost' onClick={handleClose} disabled={createIssue.isLoading}>
								Cancel
							</Button>

							<Button onClick={handleCreate} disabled={title.trim().length === 0 || body.trim().length === 0} loading={createIssue.isLoading}>
								Create
								<Plus />
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
