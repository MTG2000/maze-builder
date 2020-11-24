import React from 'react';
import styled from 'styled-components';
import Grid from '../Grid/Grid';
import ToolBox from '../ToolBox/ToolBox';

interface Props {}

const Root = styled.div`
  width: 100%;
  min-height: 100vh;
  padding-top: 30px;
  background: ${(props) => props.theme.primary};
`;

function Canvas({}: Props) {
  return (
    <Root>
      <Grid />
      <ToolBox />
    </Root>
  );
}

export default Canvas;
