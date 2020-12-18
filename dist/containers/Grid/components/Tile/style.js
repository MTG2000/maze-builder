import styled from "../../../../../web_modules/styled-components.js";
export const Root = styled.div`
  width: 100%;
  height: 100%;
  position: relative;

  :hover {
    cursor: ${(props) => props.cursor};
  }
  .tile-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    animation: appearTile 0.7s 1;

    &.animate {
      animation: appearTile 0.7s 1;
    }
  }

  .effect-img {
    width: 60%;
    height: 60%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    object-fit: contain;
    animation: appearEffect 0.7s 1;
  }

  .path {
    width: 12px;
    height: 12px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #f44336;
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 5px 12px #111;
    animation: pathMove 1.1s infinite alternate;
  }

  @media screen and (min-width: 668px) {
    background-color: ${(props) => props.color};
    .tile-img {
      mix-blend-mode: ${(props) => props.color === "transparent" ? "unset" : "luminosity"};
    }
    .effect-img {
      mix-blend-mode: ${(props) => props.color === "transparent" ? "unset" : "luminosity"};
    }

    .path {
      width: 20px;
      height: 20px;
      box-shadow: 0 10px 18px #111;
    }
  }

  @keyframes appearTile {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pathMove {
    from {
      box-shadow: 0 5px 10px #111;
      transform: translate(-50%, -50%);
    }
    to {
      box-shadow: 0 5px 6px #111;
      transform: translate(-50%, -30%);
    }
  }

  @media screen and (min-width: 668px) {
    @keyframes pathMove {
      from {
        box-shadow: 0 10px 20px #111;
      }
      to {
        box-shadow: 0 10px 12px #111;
      }
    }
  }

  @keyframes appearEffect {
    from {
      opacity: 0;
      transform: translate(-50%, -40px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }
`;
