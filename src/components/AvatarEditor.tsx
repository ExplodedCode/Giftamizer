import React from 'react';

import { useSupabase, SUPABASE_URL } from '../lib/useSupabase';
import { useSnackbar } from 'notistack';

import { useDropzone } from 'react-dropzone';
import 'cropperjs/dist/cropper.css';
import Cropper from 'react-cropper';

import { Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Typography } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { AddPhotoAlternateOutlined, Clear, Delete, FileUpload } from '@mui/icons-material';

export async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
	const res: Response = await fetch(dataUrl);
	const blob: Blob = await res.blob();
	return new File([blob], fileName, { type: 'image/jpeg' });
}

export type AvatarEditorProps = {
	bucket: string;
	filepath: string;
	imageToken: number | null;
	handleTokenUpdate?(token: number | null): void;
	disabled?: boolean;
};

export default function AvatarEditor(props: AvatarEditorProps) {
	const cropperRef = React.useRef(null);
	const { getRootProps, getInputProps } = useDropzone({
		accept: {
			'image/*': ['.png', '.gif', '.jpeg', '.jpg'],
		},
		onDrop: (files) => {
			const reader = new FileReader();
			reader.readAsDataURL(files[0]);
			reader.onload = () => {
				setSelectedImage(String(reader.result));
			};
		},
	});
	const [selectedimage, setSelectedImage] = React.useState('');

	const { client } = useSupabase();
	const { enqueueSnackbar } = useSnackbar();

	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);

	const handleUpload = async () => {
		const imageElement: any = cropperRef?.current;
		const cropper: any = imageElement?.cropper;

		setLoading(true);
		const { error } = await client.storage.from(props.bucket).upload(`${props.filepath}`, await dataUrlToFile(cropper.getCroppedCanvas().toDataURL(), 'avatar'), {
			cacheControl: '3600',
			upsert: true,
		});
		if (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} else {
			if (props.handleTokenUpdate) props.handleTokenUpdate(Date.now());
		}

		handleClose();
	};

	const handleRemove = async () => {
		setLoading(true);

		const { error } = await client.storage.from(props.bucket).remove([`${props.filepath}`]);
		if (error) {
			enqueueSnackbar(error.message, { variant: 'error' });
		} else {
			if (props.handleTokenUpdate) props.handleTokenUpdate(-1);
		}

		handleClose();
	};

	const handleClose = async () => {
		setSelectedImage('');
		setOpen(false);
		setLoading(false);
	};

	return (
		<>
			<IconButton onClick={() => setOpen(true)} disabled={props.disabled}>
				<Avatar
					children={<AddPhotoAlternateOutlined sx={{ fontSize: 128 }} />}
					src={`${SUPABASE_URL}/storage/v1/object/public/${props.bucket}/${props.filepath}?${props.imageToken}`}
					sx={{ height: 196, width: 196 }}
				/>
			</IconButton>

			<Dialog open={open} onClose={() => setOpen(false)} maxWidth='sm' fullWidth>
				<DialogTitle>Update Image</DialogTitle>
				<DialogContent>
					<Box>
						{selectedimage ? (
							<>
								<IconButton aria-label='clear' sx={{ position: 'absolute', zIndex: 1000, top: 66, right: 26 }} onClick={() => setSelectedImage('')}>
									<Clear />
								</IconButton>
								<Cropper src={selectedimage} style={{ width: '100%' }} guides={true} ref={cropperRef} aspectRatio={1} />
							</>
						) : (
							<Paper
								sx={{
									textAlign: 'center',
									padding: 5,
									cursor: 'pointer',
								}}
								{...getRootProps({
									className: 'dropzone',
								})}
							>
								<input multiple={false} {...getInputProps()} />
								<Typography variant='body1' component='div' gutterBottom>
									Select or drop an Image
								</Typography>
								<FileUpload />
							</Paper>
						)}
					</Box>
				</DialogContent>
				<DialogActions>
					{props.imageToken && (
						<LoadingButton
							color='error'
							variant='contained'
							sx={{ position: 'absolute', left: 8 }}
							onClick={handleRemove}
							endIcon={<Delete />}
							disabled={props.imageToken === null}
							loading={loading}
							loadingPosition='end'
						>
							Remove
						</LoadingButton>
					)}

					<Button color='inherit' onClick={handleClose}>
						Cancel
					</Button>

					<LoadingButton onClick={handleUpload} endIcon={<FileUpload />} disabled={selectedimage === ''} loading={loading} loadingPosition='end' variant='contained'>
						Upload
					</LoadingButton>
				</DialogActions>
			</Dialog>
		</>
	);
}
