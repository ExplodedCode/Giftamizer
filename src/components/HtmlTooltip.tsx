import { TooltipProps, Tooltip, tooltipClasses, styled } from '@mui/material';

const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => <Tooltip {...props} classes={{ popper: className }} />)(({ theme }) => ({
	[`& .${tooltipClasses.tooltip}`]: {
		backgroundColor: theme.palette.primary.main,
		color: '#fff',
		maxWidth: 400,
		fontSize: theme.typography.pxToRem(12),
		boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
	},
	[`& .${tooltipClasses.arrow}`]: {
		color: theme.palette.primary.main,
	},
}));

export default HtmlTooltip;
