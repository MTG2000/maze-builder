import styled from 'styled-components';

export const Root = styled.div<{ color: string; cursor: string }>`
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

  @media screen and (min-width: 668px) {
    background-color: ${(props) => props.color};
    .tile-img {
      mix-blend-mode: ${(props) =>
        props.color === 'transparent' ? 'unset' : 'luminosity'};
    }
    .effect-img {
      mix-blend-mode: ${(props) =>
        props.color === 'transparent' ? 'unset' : 'luminosity'};
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
