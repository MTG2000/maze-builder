import { _ as _objectWithoutProperties, a as _extends } from '../../common/useTheme-17dcdb7e.js';
import '../../common/_commonjsHelpers-eb5a497e.js';
import '../../common/index-62f0c9e2.js';
import { w as withStyles, c as clsx } from '../../common/withStyles-206764b0.js';
import { r as react } from '../../common/index-d0e3fe20.js';
import '../../common/hoist-non-react-statics.cjs-0f28cd76.js';
import '../../common/capitalize-4ec5c6e6.js';
import { T as Typography } from '../../common/Typography-16409f1a.js';

var styles = {
  /* Styles applied to the root element. */
  root: {
    margin: 0,
    padding: '16px 24px',
    flex: '0 0 auto'
  }
};
var DialogTitle = /*#__PURE__*/react.forwardRef(function DialogTitle(props, ref) {
  var children = props.children,
      classes = props.classes,
      className = props.className,
      _props$disableTypogra = props.disableTypography,
      disableTypography = _props$disableTypogra === void 0 ? false : _props$disableTypogra,
      other = _objectWithoutProperties(props, ["children", "classes", "className", "disableTypography"]);

  return /*#__PURE__*/react.createElement("div", _extends({
    className: clsx(classes.root, className),
    ref: ref
  }, other), disableTypography ? children : /*#__PURE__*/react.createElement(Typography, {
    component: "h2",
    variant: "h6"
  }, children));
});
var __pika_web_default_export_for_treeshaking__ = withStyles(styles, {
  name: 'MuiDialogTitle'
})(DialogTitle);

export default __pika_web_default_export_for_treeshaking__;
