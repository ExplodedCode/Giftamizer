import React, { FunctionComponent, useState } from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import { css } from '@emotion/css';
import { useTheme } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import axios from 'axios';
import CircularProgress from '@mui/material/CircularProgress';

export type TAlignment = 'left' | 'center' | 'right';

export type TMediaType = 'image' | 'video';

export type TUrlData = {
	url?: string;
	width?: number;
	height?: number;
	alignment?: TAlignment;
	type?: TMediaType;
};

interface IUrlPopoverStateProps {
	anchor?: HTMLElement;
	data?: TUrlData;
	isMedia?: boolean;
	onConfirm: (isMedia?: boolean, ...args: any) => void;
}

const UrlPopover: FunctionComponent<IUrlPopoverStateProps> = (props) => {
	const { spacing } = useTheme();
	const linkPopoverClass = css({
		padding: spacing(2, 2, 2, 2),
		maxWidth: 250,
	});
	const linkTextFieldClass = css({
		width: '100%',
	});

	const [data, setData] = useState<TUrlData>(
		props.data || {
			url: undefined,
			width: undefined,
			height: undefined,
			alignment: undefined,
			type: undefined,
		}
	);
	const [loading, setLoading] = useState(false);

	React.useEffect(() => {
		if (props.isMedia) {
			setData((prev) => ({
				...prev,
				type: prev.type || 'image',
				width: prev.width || 500,
			}));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.isMedia]);

	const fileInputRef = React.useRef<HTMLInputElement>(null);

	const onSizeChange = (value: any, prop: 'width' | 'height') => {
		if (value === '') {
			setData({ ...data, [prop]: undefined });
			return;
		}
		const intValue = parseInt(value, 10);
		if (isNaN(intValue)) {
			return;
		}
		setData({ ...data, [prop]: intValue });
	};

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files && event.target.files[0];
		if (file) {
			setLoading(true);
			const reader = new FileReader();
			reader.onloadend = async () => {
				const base64Url = reader.result as string;
				// Remove the data:image/*;base64, prefix if present
				const base64Data = base64Url.split(',')[1] || base64Url;
				try {
					const apiKey = '4907da253c49ac2568239bc7c125bea7';
					const formData = new FormData();
					formData.append('key', apiKey);
					formData.append('image', base64Data);
					formData.append('name', file.name);
					const response = await axios.post('https://api.imgbb.com/1/upload', formData);
					const imageUrl = response.data?.data?.url;
					setData((prev) => ({ ...prev, url: imageUrl }));
					props.onConfirm(props.isMedia, imageUrl, data.width || 500, data.height, data.alignment, 'image');
				} catch (error) {
					console.error('Image upload failed', error);
				} finally {
					setLoading(false);
				}
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSelectImage = () => {
		if (fileInputRef.current && !loading) {
			fileInputRef.current.click();
		}
	};

	return (
		<Popover
			open={props.anchor !== undefined}
			anchorEl={props.anchor}
			anchorOrigin={{
				vertical: 'bottom',
				horizontal: 'left',
			}}
			transformOrigin={{
				vertical: 'top',
				horizontal: 'left',
			}}
			onClose={() => props.onConfirm(props.isMedia, data.url, data.width, data.height, data.alignment, data.type)}
		>
			<div className={linkPopoverClass}>
				<Grid container spacing={1}>
					<Grid container size="grow" spacing={1}>
						{props.data?.url !== undefined && (
							<Grid size={12}>
								<TextField
									className={linkTextFieldClass}
									onChange={(event) => setData({ ...data, url: event.target.value })}
									label='URL'
									defaultValue={props.data && props.data.url}
									// autoFocus={true}
									slotProps={{
										inputLabel: {
											shrink: true,
										},
									}}
									disabled={loading}
								/>
							</Grid>
						)}
						{props.isMedia ? (
							<>
								{/* <Grid item xs={12}>
									<ButtonGroup fullWidth>
										<Button color={!data.type || data.type === 'image' ? 'primary' : 'inherit'} size='small' onClick={() => setData({ ...data, type: 'image' })} disabled={loading}>
											<InsertPhotoIcon />
										</Button>
										<Button color={data.type === 'video' ? 'primary' : 'inherit'} size='small' onClick={() => setData({ ...data, type: 'video' })} disabled={loading}>
											<MovieIcon />
										</Button>
									</ButtonGroup>
								</Grid> */}
								{data.type === 'image' && (
									<Grid size={12}>
										<input type='file' accept='image/*' style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} disabled={loading} />
										<Button fullWidth variant='outlined' size='small' onClick={handleSelectImage} disabled={loading}>
											Select Image
										</Button>
										{loading && <CircularProgress size={24} style={{ position: 'absolute', right: 16, top: 8 }} />}
									</Grid>
								)}
								<Grid size={6}>
									<TextField
										onChange={(event) => onSizeChange(event.target.value, 'width')}
										value={data.width || ''}
										label='Width'
										slotProps={{
											inputLabel: {
												shrink: true,
											},
										}}
										disabled={loading}
									/>
								</Grid>
								<Grid size={6}>
									<TextField
										onChange={(event) => onSizeChange(event.target.value, 'height')}
										value={data.height || ''}
										label='Height'
										slotProps={{
											inputLabel: {
												shrink: true,
											},
										}}
										disabled={loading}
									/>
								</Grid>
								{/* <Grid item xs={12}>
									<ButtonGroup fullWidth>
										<Button color={data.alignment === 'left' ? 'primary' : 'inherit'} size='small' onClick={() => setData({ ...data, alignment: 'left' })} disabled={loading}>
											<FormatAlignLeft />
										</Button>
										<Button color={data.alignment === 'center' ? 'primary' : 'inherit'} size='small' onClick={() => setData({ ...data, alignment: 'center' })} disabled={loading}>
											<FormatAlignCenter />
										</Button>
										<Button color={data.alignment === 'right' ? 'primary' : 'inherit'} size='small' onClick={() => setData({ ...data, alignment: 'right' })} disabled={loading}>
											<FormatAlignRight />
										</Button>
									</ButtonGroup>
								</Grid> */}
							</>
						) : null}
					</Grid>
					<Grid container size={12} direction='row' sx={{ justifyContent: 'flex-end' }}>
						{props.data && props.data.url ? (
							<Button onClick={() => props.onConfirm(props.isMedia, '')} disabled={loading}>
								<DeleteIcon />
							</Button>
						) : null}
						<Button onClick={() => props.onConfirm(props.isMedia, data.url, data.width, data.height, data.alignment, data.type)} disabled={loading}>
							<CheckIcon />
						</Button>
					</Grid>
				</Grid>
			</div>
		</Popover>
	);
};

export default UrlPopover;
