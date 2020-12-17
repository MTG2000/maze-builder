import React from 'react';
import styled from 'styled-components';

interface Props {}
const Root = styled.header`
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);

  font-family: 'Modak', cursive;
  background-color: ${(props) => props.theme.secondary};
  padding: 8px 20px;
  border-radius: 0 0 30px 30px;

  z-index: 3;

  h2 {
    color: #fff;

    -webkit-text-stroke: #111 1px;
    font-size: 22px;
    margin: 0;
    text-align: center;
  }

  @media screen and (min-width: 668px) {
    padding: 15px 40px;

    h2 {
      font-size: 48px;
      -webkit-text-stroke: #111 3px;
    }
  }
`;

function Header({}: Props) {
  return (
    <Root>
      <h2>Maze Builder</h2>
    </Root>
  );
}

export default Header;
