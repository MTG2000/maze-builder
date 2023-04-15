import React from 'react';
import styled from 'styled-components';
import Grid from '../Grid/Grid';
import ToolBox from '../ToolBox/ToolBox';

interface Props {}

const Root = styled.div`
  width: 100%;
  min-height: 100vh;
  padding-top: 120px;
  background: linear-gradient(0deg, #503185, #43164a); ;
`;

function Canvas({}: Props) {
  return (
    <Root>
      <ToolBox />
      <Grid />
    </Root>
  );
}

export default Canvas;
