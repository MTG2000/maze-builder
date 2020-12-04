import styled from "../../../web_modules/styled-components.js";
export const Root = styled.div`
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  left: 0;
  background-color: ${(props) => props.theme.secondary};
  padding: 20px 30px;
  border-radius: 0 50px 50px 0;

  .tool {
    margin: 30px 0;
    cursor: pointer;
  }

  @media screen and (max-width: 668px) {
    top: unset;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    padding: 9px 12px;
    border-radius: 0;
    display: flex;
    width: 100vw;
    overflow: scroll;

    .tool {
      margin: 0 20px;
      cursor: pointer;
    }
  }
`;
