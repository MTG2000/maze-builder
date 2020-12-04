import { _ as _objectWithoutProperties, a as _extends } from '../../common/useTheme-17dcdb7e.js';
import '../../common/_commonjsHelpers-eb5a497e.js';
import '../../common/index-62f0c9e2.js';
import { w as withStyles, c as clsx } from '../../common/withStyles-206764b0.js';
import { r as react } from '../../common/index-d0e3fe20.js';
import '../../common/hoist-non-react-statics.cjs-0f28cd76.js';

var styles = function styles(theme) {
  return {
    /* Styles applied to the root element. */
    root: {
      flex: '1 1 auto',
      WebkitOverflowScrolling: 'touch',
      // Add iOS momentum scrolling.
      overflowY: 'auto',
      padding: '8px 24px',
      '&:first-child': {
        // dialog without title
        paddingTop: 20
      }
    },

    /* Styles applied to the root element if `dividers={true}`. */
    dividers: {
      padding: '16px 24px',
      borderTop: "1px solid ".concat(theme.palette.divider),
      borderBottom: "1px solid ".concat(theme.palette.divider)
    }
  };
};
var DialogContent = /*#__PURE__*/react.forwardRef(function DialogContent(props, ref) {
  var classes = props.classes,
      className = props.className,
      _props$dividers = props.dividers,
      dividers = _props$dividers === void 0 ? false : _props$dividers,
      other = _objectWithoutProperties(props, ["classes", "className", "dividers"]);

  return /*#__PURE__*/react.createElement("div", _extends({
    className: clsx(classes.root, className, dividers && classes.dividers),
    ref: ref
  }, other));
});
var __pika_web_default_export_for_treeshaking__ = withStyles(styles, {
  name: 'MuiDialogContent'
})(DialogContent);

export default __pika_web_default_export_for_treeshaking__;
