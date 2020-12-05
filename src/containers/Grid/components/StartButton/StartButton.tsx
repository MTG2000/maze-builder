import React from 'react';
import styled from 'styled-components';
import { Button } from '@material-ui/core';

interface Props {
  onClick: () => void;
  loading: boolean;
}

const Root = styled(Button)`
  position: fixed !important;
  background-color: ${(props) => props.theme.secondary};
  color: #000;
  padding: 15px 22px !important;
  top: 80%;
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
    top: 50%;
    left: unset;
    right: 100px;
    transform: none;
    font-size: 22px !important;

    padding: 17px 30px !important;
  }
`;

function StartButton({ onClick, loading }: Props) {
  return (
    <Root
      disabled={loading}
      variant="contained"
      color="secondary"
      onClick={onClick}
    >
      Start Searching 🔍
    </Root>
  );
}

export default StartButton;
