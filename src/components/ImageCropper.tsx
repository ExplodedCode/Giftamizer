import React from 'react';

import { useDropzone } from 'react-dropzone';
import 'cropperjs/dist/cropper.css';
import Cropper from 'react-cropper';

import { Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Typography } from '@mui/material';
import { AddPhotoAlternateOutlined, Clear, FileUpload } from '@mui/icons-material';

export async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
	const res: Response = await fetch(dataUrl);
	const blob: Blob = await res.blob();
	return new File([blob], fileName, { type: 'image/jpeg' });
}

type ImageCropperProps = {
	value?: string | undefined;
	onChange?: (value: string | undefined) => void;
	disabled?: boolean;
	square?: boolean;
	importedImage?: string | undefined;
};

export default function ImageCropper({ value, onChange, disabled, square, importedImage }: ImageCropperProps) {
	const cropperRef = React.useRef(null);

	const [open, setOpen] = React.useState(false);
	const [selectedimage, setSelectedImage] = React.useState(typeof value === 'string' ? value : '');
	const [imageLoaded, setImageLoaded] = React.useState<boolean>(typeof value === 'string');

	const { getRootProps, getInputProps } = useDropzone({
		accept: {
			'image/*': ['.png', '.gif', '.jpeg', '.jpg'],
		},
		onDrop: (files) => {
			const reader = new FileReader();
			reader.readAsDataURL(files[0]);
			reader.onload = () => {
				setSelectedImage(String(reader.result));
				setImageLoaded(true);
			};
		},
	});

	const handleSelectImage = async () => {
		if (imageLoaded) {
			const imageElement: any = cropperRef?.current;
			const cropper: any = imageElement?.cropper;

			if (onChange) onChange(cropper.getCroppedCanvas().toDataURL());
		} else {
			setSelectedImage('');
			if (onChange) onChange(undefined);
		}

		handleClose();
	};

	const handleClose = async () => {
		setOpen(false);
	};

	const handleOpen = async () => {
		setSelectedImage(selectedimage ? selectedimage : typeof value === 'string' ? value : '');
		setImageLoaded(selectedimage.length > 0);

		setOpen(true);
	};

	// allow metadata image to be set
	React.useEffect(() => {
		if (typeof importedImage === 'string') {
			setSelectedImage(importedImage);
			setImageLoaded(true);
		}
	}, [importedImage]);

	return (
		<>
			<IconButton onClick={handleOpen} disabled={disabled}>
				<Avatar children={<AddPhotoAlternateOutlined sx={{ fontSize: 128 }} />} src={value} sx={{ height: 196, width: 196 }} />
			</IconButton>

			<Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
				<DialogTitle>Select Image</DialogTitle>
				<DialogContent>
					<Box>
						{imageLoaded ? (
							<>
								<IconButton
									aria-label='clear'
									sx={{ position: 'absolute', zIndex: 1000, top: 66, right: 26 }}
									onClick={() => {
										setImageLoaded(false);
									}}
								>
									<Clear />
								</IconButton>
								<Cropper
									className={square ? 'squared-crop' : 'rounded-crop'}
									src={selectedimage}
									style={{ height: 400, width: '100%' }}
									guides={true}
									ref={cropperRef}
									aspectRatio={1}
									autoCropArea={0.9}
								/>
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
					<Button color='inherit' onClick={handleClose}>
						Cancel
					</Button>
					<Button variant='contained' onClick={handleSelectImage}>
						Ok
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
