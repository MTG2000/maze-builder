import styled from "../../../web_modules/styled-components.js";
export const Root = styled.header`
  .fab {
    position: fixed;
    top: 20px;
    right: 20px;
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

  @media screen and (min-width: 668px) {
    .fab {
      top: unset;
      bottom: 30px;
      right: 30px;
    }
  }
`;
