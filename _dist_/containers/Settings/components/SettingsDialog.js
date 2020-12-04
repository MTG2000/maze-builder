import React, {useState} from "../../../../web_modules/react.js";
import styled from "../../../../web_modules/styled-components.js";
import Dialog2 from "../../../../web_modules/@material-ui/core/Dialog.js";
import DialogContent2 from "../../../../web_modules/@material-ui/core/DialogContent.js";
import DialogTitle2 from "../../../../web_modules/@material-ui/core/DialogTitle.js";
import {
  Typography,
  FormControlLabel,
  Checkbox,
  Slider
} from "../../../../web_modules/@material-ui/core.js";
const Root = styled(Dialog2)`
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
function SettingsDialog({open, handleClose, onChange}) {
  const [showGrid, setShowGrid] = useState(false);
  const handleShowGrid = (event) => {
    setShowGrid(event.target.checked);
    onChange({showBorders: event.target.checked});
  };
  const handleChangeDimension = (event, newValue) => {
    onChange({gridDimension: newValue});
  };
  return /* @__PURE__ */ React.createElement(Root, {
    open,
    onClose: handleClose,
    "aria-labelledby": "form-dialog-title"
  }, /* @__PURE__ */ React.createElement("div", {
    className: "card"
  }, /* @__PURE__ */ React.createElement(DialogTitle2, {
    className: "title"
  }, "Settings"), /* @__PURE__ */ React.createElement(DialogContent2, {
    className: "content"
  }, /* @__PURE__ */ React.createElement(Typography, {
    id: "discrete-slider-small-steps",
    gutterBottom: true
  }, "Grid Dimensions"), /* @__PURE__ */ React.createElement(Slider, {
    defaultValue: 8,
    step: 1,
    marks: true,
    min: 5,
    max: 12,
    valueLabelDisplay: "auto",
    onChange: handleChangeDimension
  }), /* @__PURE__ */ React.createElement(FormControlLabel, {
    control: /* @__PURE__ */ React.createElement(Checkbox, {
      checked: showGrid,
      onChange: handleShowGrid,
      name: "Toggle Grid",
      color: "primary"
    }),
    label: "Toggle Grid Borders"
  }))));
}
export default SettingsDialog;
