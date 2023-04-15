import React, { useState } from 'react';
import styled from 'styled-components';

import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import {
  Typography,
  FormControlLabel,
  Checkbox,
  Slider,
  Divider,
  Grid,
} from '@material-ui/core';

interface Props {
  open: boolean;
  handleClose: () => void;
  onChange: (value: SettingsChanges) => void;
}

export interface SettingsChanges {
  showBorders?: boolean;
  gridDimension?: number;
}

const Root = styled(Dialog)`
  .card {
    background-color: ${(props) => props.theme.secondary};
    color: #111;
    font-size: 20px;
  }

  .title {
    h2 {
      color: #fff;
      font-family: 'Modak', cursive !important;
      -webkit-text-stroke: #111 3px;
      font-size: 30px;
    }
  }
`;

function SettingsDialog({ open, handleClose, onChange }: Props) {
  const [showGrid, setShowGrid] = useState(false);

  const handleShowGrid = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowGrid(event.target.checked);
    onChange({ showBorders: event.target.checked });
  };

  const handleChangeDimension = (event: any, newValue: number | number[]) => {
    onChange({ gridDimension: newValue as number });
  };

  return (
    <Root open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
      <div className="card">
        <DialogTitle className="title">Settings</DialogTitle>
        <DialogContent className="content">
          <Typography
            component="label"
            id="dimension-slider-label"
            gutterBottom
          >
            Grid Dimensions
          </Typography>
          <Slider
            aria-labelledby="dimension-slider-label"
            defaultValue={8}
            step={1}
            marks
            min={5}
            max={12}
            valueLabelDisplay="auto"
            onChange={handleChangeDimension}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showGrid}
                onChange={handleShowGrid}
                name="Toggle Grid"
                color="primary"
              />
            }
            label="Toggle Grid Borders"
          />
        </DialogContent>
      </div>
    </Root>
  );
}

export default SettingsDialog;
