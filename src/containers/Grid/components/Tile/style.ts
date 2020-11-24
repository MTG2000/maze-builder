import styled from 'styled-components';

export const Root = styled.div<{ color: string; cursor: string }>`
  width: 100%;
  height: 100%;
  background-color: ${(props) => props.color};
  position: relative;

  :hover {
    cursor: ${(props) => props.cursor};
  }
  .tile-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    mix-blend-mode: ${(props) =>
      props.color === 'transparent' ? 'unset' : 'luminosity'};
    animation: appearTile 0.7s 1;
  }

  .effect-img {
    width: 60%;
    height: 60%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    mix-blend-mode: ${(props) =>
      props.color === 'transparent' ? 'unset' : 'luminosity'};
    object-fit: contain;
    animation: appearEffect 0.7s 1;
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
