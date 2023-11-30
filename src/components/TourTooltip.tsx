import * as React from 'react';

import { Mask } from '@reactour/mask';

import { Paper } from '@mui/material';
import MuiPopper, { PopperPlacementType, PopperProps as MuiPopperProps } from '@mui/material/Popper';
import { styled } from '@mui/material/styles';

export interface PopperProps extends MuiPopperProps {
	mask?: boolean;
	backgroundColor?: string;
}

const Popper = styled(MuiPopper)<PopperProps>(({ theme, mask, backgroundColor }) => ({
	zIndex: 100000,

	'& > div': {
		position: 'relative',
	},
	'&[data-popper-placement*="bottom"]': {
		'& > div': {
			marginTop: mask ? 14 : 8,
		},
		'& .MuiPopper-arrow': {
			top: 0,
			left: 0,
			marginTop: '-0.9em',
			width: '3em',
			height: '1em',
			'&::before': {
				borderWidth: '0 1em 1em 1em',
				borderColor: `transparent transparent ${backgroundColor ? backgroundColor : theme.palette.mode === 'light' ? '#ffffff' : '#383838'} transparent`,
			},
		},
	},
	'&[data-popper-placement*="top"]': {
		'& > div': {
			marginBottom: mask ? 14 : 8,
		},
		'& .MuiPopper-arrow': {
			bottom: 0,
			left: 0,
			marginBottom: '-0.9em',
			width: '3em',
			height: '1em',
			'&::before': {
				borderWidth: '1em 1em 0 1em',
				borderColor: `${backgroundColor ? backgroundColor : theme.palette.mode === 'light' ? '#ffffff' : '#383838'} transparent transparent transparent`,
			},
		},
	},
	'&[data-popper-placement*="right"]': {
		'& > div': {
			marginLeft: mask ? 14 : 8,
		},
		'& .MuiPopper-arrow': {
			left: 0,
			marginLeft: '-0.9em',
			height: '3em',
			width: '1em',
			'&::before': {
				borderWidth: '1em 1em 1em 0',
				borderColor: `transparent ${backgroundColor ? backgroundColor : theme.palette.mode === 'light' ? '#ffffff' : '#383838'} transparent transparent`,
			},
		},
	},
	'&[data-popper-placement*="left"]': {
		'& > div': {
			marginRight: mask ? 14 : 8,
		},
		'& .MuiPopper-arrow': {
			right: 0,
			marginRight: '-0.9em',
			height: '3em',
			width: '1em',
			'&::before': {
				borderWidth: '1em 0 1em 1em',
				borderColor: `transparent transparent transparent ${backgroundColor ? backgroundColor : theme.palette.mode === 'light' ? '#ffffff' : '#383838'}`,
			},
		},
	},
}));

const Arrow = styled('div')({
	position: 'absolute',
	fontSize: 7,
	width: '3em',
	height: '3em',
	'&::before': {
		content: '""',
		margin: 'auto',
		display: 'block',
		width: 0,
		height: 0,
		borderStyle: 'solid',
	},
});

type RectType = {
	bottom: number;
	height: number;
	left: number;
	right: number;
	top: number;
	width: number;
	x: number;
	y: number;
};

interface Props {
	open: boolean;
	anchorEl?: Element | null;
	placement?: PopperPlacementType;
	content: React.ReactElement;
	allowClick?: boolean;
	mask?: boolean;
	arrow?: boolean;
	backgroundColor?: string;
	color?: string;
}

export default function TourTooltip({ open, anchorEl, placement = 'top', content, allowClick = false, mask = false, backgroundColor, color }: Props) {
	const [arrowRef, setArrowRef] = React.useState(null);
	const [rect, setRect] = React.useState<RectType | undefined>();

	React.useEffect(() => {
		if (anchorEl) {
			setRect(anchorEl.getBoundingClientRect());
		}
	}, [anchorEl]);

	return (
		<>
			{open && mask && rect && (
				<Mask
					sizes={rect}
					styles={{
						maskArea: (base: any) => ({
							...base,
							rx: 4,
						}),
						highlightedArea: (base: any) => ({
							...base,
							display: allowClick ? 'none' : 'block', // don't allow clicking on highlighted element
						}),
					}}
					padding={6}
				/>
			)}

			<Popper
				open={open && rect !== undefined}
				mask={mask}
				backgroundColor={backgroundColor}
				color={color}
				anchorEl={anchorEl}
				placement={placement}
				disablePortal={false}
				modifiers={[
					{
						name: 'flip',
						enabled: true,
						options: {
							altBoundary: true,
							rootBoundary: 'document',
							padding: 8,
						},
					},
					{
						name: 'preventOverflow',
						enabled: true,
						options: {
							altAxis: true,
							altBoundary: true,
							tether: true,
							rootBoundary: 'document',
							padding: 8,
						},
					},
					{
						name: 'arrow',
						enabled: true,
						options: {
							element: arrowRef,
						},
					},
				]}
			>
				<div>
					<Arrow
						// @ts-ignore
						ref={setArrowRef}
						className='MuiPopper-arrow'
					/>
					<Paper
						elevation={12}
						sx={{
							maxWidth: 400,
							backgroundColor: backgroundColor ? backgroundColor : undefined,
							color: color ? color : undefined,
						}}
					>
						{content}
					</Paper>
				</div>
			</Popper>
		</>
	);
}
