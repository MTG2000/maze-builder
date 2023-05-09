import styled from "../../../web_modules/styled-components.js";
export const Root = styled.div`
  --xPadding: 16px;
  position: relative;
  width: min(calc(90vw - (var(--xPadding) * 2)), 900px);
  aspect-ratio: 1/1;
  margin: auto;
  background: #fff4e4de;
  display: grid;
  grid-template-columns: repeat(${(props) => props.dimensions}, 1fr);
  grid-template-rows: repeat(${(props) => props.dimensions}, 1fr);
  border-radius: 10px;
  overflow: hidden;
  user-select: none;

  .tile {
    border: ${(props) => props.showBorders ? " 0.5px inset #000" : "none"};
    aspect-ratio: 1/1;
    min-height: 0;
  }

  @media screen and (min-width: 668px) {
    --xPadding: 150px;
  }
`;
