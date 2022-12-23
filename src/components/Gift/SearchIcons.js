import React from 'react';

import { makeStyles } from '@mui/styles';

import Paper from '@mui/material/Paper';

import clsx from 'clsx';

import InputBase from '@mui/material/InputBase';
import Typography from '@mui/material/Typography';

import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';

import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
// import HighlightedCode from 'docs/src/modules/components/HighlightedCode';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import FlexSearch from 'flexsearch';
import SearchIcon from '@mui/icons-material/Search';
import FormControlLabel from '@mui/material/FormControlLabel';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import Link from '@mui/material/Link';
import * as mui from '@mui/icons-material';
import synonyms from './notification_synonyms';

if (process.env.NODE_ENV !== 'production') {
	Object.keys(synonyms).forEach((icon) => {
		if (!mui[icon]) {
			throw new Error(`The icon ${icon} does no longer exist.`);
		}
	});
}

function IconLookup(props) {
	var Icon = {
		icon: mui[props?.icon],
	};

	try {
		if (Icon) {
			return <Icon.icon />;
		} else {
			return <mui.ErrorOutline />;
		}
	} catch (error) {
		console.log(error);
		return <mui.ErrorOutline />;
	}
}

function selectNode(node) {
	// Clear any current selection
	const selection = window.getSelection();
	selection.removeAllRanges();

	// Select code
	const range = document.createRange();
	range.selectNodeContents(node);
	selection.addRange(range);
}

let Icons = (props) => {
	const { icons, classes, handleClickOpen } = props;

	const handleClick = (event) => {
		selectNode(event.currentTarget);
	};

	return (
		<div>
			{icons.map((icon) => {
				return (
					<span key={icon.key} className={clsx('markdown-body', classes.icon)}>
						<icon.Icon
							tabIndex={-1}
							onClick={handleClickOpen}
							title={icon.key}
							className={classes.iconSvg}
							data-ga-event-category='material-icons'
							data-ga-event-action='click'
							data-ga-event-label={icon.key}
						/>
						{/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
						<p onClick={handleClick}>{icon.key}</p>
					</span>
				);
			})}
		</div>
	);
};

Icons.propTypes = {
	classes: PropTypes.object.isRequired,
	handleClickOpen: PropTypes.func.isRequired,
	icons: PropTypes.array.isRequired,
};
Icons = React.memo(Icons);

const useStyles = makeStyles((theme) => ({
	root: {
		minHeight: 500,
	},
	form: {
		margin: theme.spacing(2, 0),
	},
	paper: {
		// position: 'sticky',
		top: 80,
		padding: '2px 4px',
		display: 'flex',
		alignItems: 'center',
		marginBottom: theme.spacing(2),
		width: '100%',
	},
	input: {
		marginLeft: 8,
		flex: 1,
	},
	iconButton: {
		padding: 10,
	},
	icon: {
		display: 'inline-block',
		width: 86,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		textAlign: 'center',
		color: theme.palette.text.secondary,
		margin: '0 4px',
		fontSize: 12,
		'& p': {
			margin: 0,
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			whiteSpace: 'nowrap',
		},
	},
	iconSvg: {
		boxSizing: 'content-box',
		cursor: 'pointer',
		color: theme.palette.text.primary,
		borderRadius: theme.shape.borderRadius,
		transition: theme.transitions.create(['background-color', 'box-shadow'], {
			duration: theme.transitions.duration.shortest,
		}),
		fontSize: 40,
		padding: theme.spacing(2),
		margin: theme.spacing(0.5, 0),
		'&:hover': {
			backgroundColor: theme.palette.background.paper,
			boxShadow: theme.shadows[1],
		},
	},
	results: {
		marginBottom: theme.spacing(1),
	},
}));

const searchIndex = FlexSearch.create({
	async: true,
	tokenize: 'full',
});

const allIconsMap = {};
const allIcons = Object.keys(mui)
	.sort()
	.map((key) => {
		let tag;
		if (key.indexOf('Outlined') !== -1) {
			tag = 'Outlined';
		} else if (key.indexOf('TwoTone') !== -1) {
			tag = 'Two tone';
		} else if (key.indexOf('Rounded') !== -1) {
			tag = 'Rounded';
		} else if (key.indexOf('Sharp') !== -1) {
			tag = 'Sharp';
		} else {
			tag = 'Filled';
		}

		let searchable = key.replace(/(Outlined|TwoTone|Rounded|Sharp)$/, '');
		if (synonyms[searchable]) {
			searchable += ` ${synonyms[searchable]}`;
		}
		searchIndex.add(key, searchable);

		const icon = {
			key,
			tag,
			Icon: mui[key],
		};
		allIconsMap[key] = icon;
		return icon;
	});

export default function SearchIcons(props) {
	// console.log(allIconsMap[props?.value?.key]);

	const classes = useStyles();
	const [tag, setTag] = React.useState(props?.value?.tag || 'Filled');
	const [keys, setKeys] = React.useState(null);
	const [selectedIcon, setSelectedIcon] = React.useState(props?.value || null);

	const handleClickOpen = React.useCallback((event) => {
		setSelectedIcon(allIconsMap[event.currentTarget.getAttribute('title')]);
		props.onChange(allIconsMap[event.currentTarget.getAttribute('title')]);
	}, []);

	const isMounted = React.useRef(false);
	React.useEffect(() => {
		isMounted.current = true;
		return () => {
			isMounted.current = false;
		};
	}, []);

	const handleChange = React.useMemo(
		() =>
			debounce((value) => {
				if (!isMounted.current) {
					return;
				}

				if (value === '') {
					setKeys(null);
				} else {
					searchIndex.search(value).then((results) => {
						setKeys(results);
					});
				}
			}, 220),
		[]
	);

	const icons = React.useMemo(() => (keys === null ? allIcons : keys.map((key) => allIconsMap[key])).filter((icon) => tag === icon.tag), [tag, keys]);

	return (
		<div>
			{/* Selected Icon: {selectedIcon && <IconLookup icon={selectedIcon.key} />}
			<br /> */}
			<Grid container className={classes.root}>
				{/* <Grid item xs={12} sm={3}>
					<form className={classes.form}>
						<RadioGroup>
							{['Filled', 'Outlined', 'Rounded', 'Two tone', 'Sharp'].map((key) => {
								return <FormControlLabel key={key} control={<Radio checked={tag === key} onChange={() => setTag(key)} value={key} />} label={key} />;
							})}
						</RadioGroup>
					</form>
				</Grid> */}
				<Grid item xs={12}>
					<Paper className={classes.paper}>
						<IconButton className={classes.iconButton} aria-label='search'>
							<SearchIcon />
						</IconButton>
						<InputBase
							autoFocus
							onChange={(event) => {
								handleChange(event.target.value);
							}}
							className={classes.input}
							placeholder='Search icons…'
							inputProps={{ 'aria-label': 'search icons' }}
						/>
					</Paper>
					<Typography className={classes.results}>{`${icons.length} matching results`}</Typography>
					<div style={{ height: 600, overflow: 'scroll' }}>
						<Icons icons={icons} classes={classes} handleClickOpen={handleClickOpen} />
					</div>
				</Grid>
			</Grid>
		</div>
	);
}
