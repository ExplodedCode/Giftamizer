import React from 'react';
import Button from '@material-ui/core/Button';
import Popper from '@material-ui/core/Popper';
import PopupState, { bindToggle, bindPopper } from 'material-ui-popup-state';
import Fade from '@material-ui/core/Fade';
import Paper from '@material-ui/core/Paper';

import { deleteList } from '../../../firebase/gift/lists';

export default function PopperPopupState(props) {
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
									<Button variant='contained' style={{ margin: 4 }} {...bindToggle(popupState)}>
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
													props.closeModal();
													props.getlists();
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
