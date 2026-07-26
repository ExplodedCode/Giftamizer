import React from 'react';

import { useDropzone } from 'react-dropzone';
import 'cropperjs/dist/cropper.css';
import Cropper from 'react-cropper';

import { ImagePlus, Upload, X } from 'lucide-react';

import { cn, useMediaQuery } from '../lib/utils';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

export { dataUrlToFile } from '../lib/useSupabase/utils';

type ImageCropperProps = {
	value?: string | undefined;
	onChange?: (value: string | undefined) => void;
	onClick?: () => void;
	onClose?: () => void;
	disabled?: boolean;
	aspectRatio?: number;
	autoCropArea?: number;
	square?: boolean;
	importedImage?: string | undefined;
	tour_element?: string;
};

export default function ImageCropper({ value, onChange, onClick, onClose, disabled, aspectRatio, autoCropArea, square, importedImage, tour_element }: ImageCropperProps) {
	const cropperRef = React.useRef(null);

	const isMobile = useMediaQuery('(max-width: 599.95px)');

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

			if (onChange) onChange(cropper.getCroppedCanvas({ maxWidth: 1024, maxHeight: 1024 }).toDataURL());
		} else {
			setSelectedImage('');
			if (onChange) onChange(undefined);
		}

		handleClose();
	};

	const handleClose = async () => {
		if (onClose) onClose();

		setOpen(false);
	};

	const handleOpen = async () => {
		if (onClick) onClick();

		setSelectedImage(selectedimage ? selectedimage : typeof value === 'string' ? value : '');
		setImageLoaded(selectedimage.length > 0);

		setOpen(true);
	};

	const handlePaste = React.useCallback((event: ClipboardEvent) => {
		if (event.clipboardData) {
			const items = event.clipboardData.items;
			for (let i = 0; i < items.length; i++) {
				if (items[i].type.indexOf('image') !== -1) {
					const blob = items[i].getAsFile();
					if (blob) {
						const reader = new FileReader();
						reader.onload = () => {
							setSelectedImage(String(reader.result));
							setImageLoaded(true);
						};
						reader.readAsDataURL(blob);
					}
				}
			}
		}
	}, []);

	React.useEffect(() => {
		if (open) {
			const handlePasteWrapper = (e: any) => handlePaste(e);
			document.addEventListener('paste', handlePasteWrapper);
			return () => {
				document.removeEventListener('paste', handlePasteWrapper);
			};
		}
	}, [open, handlePaste]);

	// allow metadata image to be set
	React.useEffect(() => {
		if (typeof importedImage === 'string') {
			setSelectedImage(importedImage);
			setImageLoaded(true);
		}
	}, [importedImage]);

	return (
		<>
			<button
				type='button'
				{...({ 'tour-element': tour_element ?? undefined } as object)}
				onClick={handleOpen}
				disabled={disabled}
				className={cn(
					'group flex size-[196px] cursor-pointer items-center justify-center overflow-hidden bg-muted text-muted-foreground transition-colors outline-none',
					'hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
					square ? 'rounded-xl' : 'rounded-full'
				)}
			>
				{value ? <img src={value} alt='Selected' className='size-full object-cover' /> : <ImagePlus className='size-24 opacity-60 transition-opacity group-hover:opacity-90' />}
			</button>

			<Dialog open={open} onOpenChange={(next) => (next ? handleOpen() : handleClose())}>
				<DialogContent size='default'>
					<DialogHeader>
						<DialogTitle>Select Image</DialogTitle>
					</DialogHeader>

					<div className='relative'>
						{imageLoaded ? (
							<>
								<button
									type='button'
									aria-label='clear'
									className='absolute top-2 right-2 z-[1000] cursor-pointer rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70'
									onClick={() => {
										setImageLoaded(false);
									}}
								>
									<X className='size-4' />
								</button>
								<Cropper
									className={square ? 'squared-crop' : 'rounded-crop'}
									src={selectedimage}
									style={{ height: 400, width: '100%' }}
									guides={true}
									ref={cropperRef}
									aspectRatio={aspectRatio}
									autoCropArea={autoCropArea ?? 1}
									background={false}
									viewMode={1}
								/>
							</>
						) : (
							<div
								{...getRootProps({
									className: 'dropzone',
								})}
								className='flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border p-10 text-center transition-colors hover:border-primary/50 hover:bg-accent/50'
							>
								<input multiple={false} {...getInputProps()} />
								<p className='text-sm'>{isMobile ? 'Select an Image' : 'Select, drop or paste an Image'}</p>
								<Upload className='size-6 text-muted-foreground' />
							</div>
						)}
					</div>

					<DialogFooter>
						<Button variant='ghost' onClick={handleClose}>
							Cancel
						</Button>
						<Button onClick={handleSelectImage}>Ok</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
