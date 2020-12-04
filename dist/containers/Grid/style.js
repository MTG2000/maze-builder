import styled from "../../../web_modules/styled-components.js";
export const Root = styled.div`
  position: relative;
  width: ${(props) => props.width}px;
  min-height: ${(props) => props.width}px;
  margin: auto;
  background: #fff4e4de;
  display: flex;
  flex-wrap: wrap;
  border-radius: 10px;
  overflow: hidden;
  user-select: none;

  .tile {
    width: ${(props) => props.tileWidth}px;
    height: ${(props) => props.tileWidth}px;
    border: ${(props) => props.showBorders ? " 0.5px inset #000" : "none"};
  }
`;
