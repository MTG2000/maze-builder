import React from 'react';
import styled from 'styled-components';
import SettingsDialog, { SettingsChanges } from './components/SettingsDialog';
import { useDispatch } from 'react-redux';
import { isNullOrUndefined } from 'util';
import { setShowBorders, setDimension } from 'src/core/store/slices/grid.slice';
import { Fab } from '@material-ui/core';
import gearsImg from 'src/assets/gear.svg';

interface Props {}
const Root = styled.header`
  .fab {
    position: fixed;
    bottom: 30px;
    right: 30px;
    padding: 10px;

    :hover {
      img {
        transform: rotate(120deg);
      }
    }

    img {
      width: 100%;
      height: 100%;
      transition: transform 0.3s ease-in-out;
    }
  }
`;

function Settings({}: Props) {
  const [open, setOpen] = React.useState(false);

  const dispatch = useDispatch();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
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
        open={open}
        handleClose={handleClose}
        onChange={handleChange}
      />
      <Fab color="secondary" className="fab" onClick={handleClickOpen}>
        <img src={gearsImg} alt="" />
      </Fab>
    </Root>
  );
}

export default Settings;
