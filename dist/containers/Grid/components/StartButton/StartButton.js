import React from "../../../../../web_modules/react.js";
import styled from "../../../../../web_modules/styled-components.js";
import {Button} from "../../../../../web_modules/@material-ui/core.js";
const Root = styled(Button)`
  position: fixed !important;
  background-color: ${(props) => props.theme.secondary};
  color: #000;
  padding: 15px 22px !important;
  bottom: 20%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  border: 0;
  border-radius: 13px;
  font-size: 18px !important;
  font-weight: bold !important;
  cursor: pointer;

  &:hover {
  }

  @media screen and (min-width: 992px) {
    font-size: 22px !important;
    bottom: 120px;
    padding: 17px 30px !important;
  }
`;
function StartButton({onClick, loading}) {
  return /* @__PURE__ */ React.createElement(Root, {
    disabled: loading,
    variant: "contained",
    color: "secondary",
    onClick
  }, "Start \u{1F50D}");
}
export default StartButton;
