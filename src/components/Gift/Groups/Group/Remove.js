import React from 'react';
import Button from '@mui/material/Button';
import Popper from '@mui/material/Popper';
import PopupState, { bindToggle, bindPopper } from 'material-ui-popup-state';
import Fade from '@mui/material/Fade';
import Paper from '@mui/material/Paper';

import { removeMember } from '../../../../firebase/gift/members';

export default function PopperPopupState(props) {
	return (
		<PopupState variant='popper' popupId='demo-popup-popper'>
			{(popupState) => (
				<div>
					<Button color='secondary' {...bindToggle(popupState)}>
						Remove
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
											removeMember(props.group, props.member).then((result) => {
												if (result === 'ok') {
													props.getMembers();
													props.setAlert({ open: true, message: 'Member Removed!', severity: 'success' });
													bindToggle(popupState);
												} else {
													props.setAlert({ open: true, message: 'Error removing member!', severity: 'error' });
												}
											});
										}}
									>
										Yes Remove Them!
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
