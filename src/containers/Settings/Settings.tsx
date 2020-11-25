import React from 'react';
import SettingsDialog, { SettingsChanges } from './components/SettingsDialog';
import { useDispatch } from 'react-redux';
import { isNullOrUndefined } from 'util';
import { setShowBorders, setDimension } from 'src/core/store/slices/grid.slice';
import { Fab } from '@material-ui/core';
import gearsImg from 'src/assets/gear.svg';
import { Root } from './style';

interface Props {}

function Settings({}: Props) {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const dispatch = useDispatch();

  const handleClickOpen = () => {
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
  };

  const handleChange = (value: SettingsChanges) => {
    if (!isNullOrUndefined(value.showBorders))
      dispatch(setShowBorders(value.showBorders));
    else if (!isNullOrUndefined(value.gridDimension))
      dispatch(setDimension(value.gridDimension));
  };

  return (
    <Root>
      <SettingsDialog
        open={dialogOpen}
        handleClose={handleClose}
        onChange={handleChange}
      />
      <Fab color="secondary" className="fab" onClick={handleClickOpen}>
        <img src={gearsImg} alt="settings" />
      </Fab>
    </Root>
  );
}

export default Settings;
