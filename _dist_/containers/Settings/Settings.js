import React from "../../../web_modules/react.js";
import SettingsDialog2 from "./components/SettingsDialog.js";
import {useDispatch} from "../../../web_modules/react-redux.js";
import {isNullOrUndefined} from "../../../web_modules/util.js";
import {setShowBorders, setDimension} from "../../core/store/slices/grid.slice.js";
import {Fab} from "../../../web_modules/@material-ui/core.js";
import gearsImg from "../../assets/gear.svg.proxy.js";
import {Root} from "./style.js";
function Settings({}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const dispatch = useDispatch();
  const handleClickOpen = () => {
    setDialogOpen(true);
  };
  const handleClose = () => {
    setDialogOpen(false);
  };
  const handleChange = (value) => {
    if (!isNullOrUndefined(value.showBorders))
      dispatch(setShowBorders(value.showBorders));
    else if (!isNullOrUndefined(value.gridDimension))
      dispatch(setDimension(value.gridDimension));
  };
  return /* @__PURE__ */ React.createElement(Root, null, /* @__PURE__ */ React.createElement(SettingsDialog2, {
    open: dialogOpen,
    handleClose,
    onChange: handleChange
  }), /* @__PURE__ */ React.createElement(Fab, {
    color: "secondary",
    className: "fab",
    onClick: handleClickOpen
  }, /* @__PURE__ */ React.createElement("img", {
    src: gearsImg,
    alt: "settings"
  })));
}
export default Settings;
