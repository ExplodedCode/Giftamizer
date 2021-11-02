import React from 'react';

import { useHistory } from 'react-router-dom';

import Button from '@mui/material/Button';
import Popper from '@mui/material/Popper';
import PopupState, { bindToggle, bindPopper } from 'material-ui-popup-state';
import Fade from '@mui/material/Fade';
import Paper from '@mui/material/Paper';

import { deleteList } from '../../../../firebase/gift/lists';

export default function PopperPopupState(props) {
	const history = useHistory();

	return (
		<PopupState variant='popper' popupId='demo-popup-popper'>
			{(popupState) => (
				<div>
					<Button color='secondary' {...bindToggle(popupState)}>
						Delete
					</Button>
					<Popper {...bindPopper(popupState)} placement='top' transition style={{ zIndex: 1500 }}>
						{({ TransitionProps }) => (
							<Fade {...TransitionProps} timeout={350}>
								<Paper style={{ padding: 8 }}>
									<b style={{ color: 'red' }}>Are you sure?</b>
									<br />
									<Button color='inherit' variant='contained' style={{ margin: 4 }} {...bindToggle(popupState)}>
										Cancel
									</Button>
									<Button
										variant='contained'
										color='secondary'
										style={{ margin: 4 }}
										onClick={() => {
											deleteList(props.list).then((result) => {
												if (result === 'ok') {
													props.setAlert({ open: true, message: 'List deleted!', severity: 'success' });
													bindToggle(popupState);
													history.push('/gift/lists');
												} else {
													props.setAlert({ open: true, message: 'Error deleting list!', severity: 'error' });
												}
											});
										}}
									>
										Yes Delete it!
									</Button>
								</Paper>
							</Fade>
						)}
					</Popper>
				</div>
			)}
		</PopupState>
	);
}
