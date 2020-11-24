import React from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedTool } from 'src/core/store/slices/toolbox.slice';
import groundImg from 'src/assets/tile-ground.png';
import waterImg from 'src/assets/tile-water.png';
import skarkImg from 'src/assets/shark.png';

import holeImg from 'src/assets/hole.png';
import eraserImg from 'src/assets/eraser.png';

import Tool from './components/Tool/Tool';
import { RootState } from 'src/core/store/rootReducer';
import { Tools } from 'src/core/models/Tools';

interface Props {}

const Root = styled.div`
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
`;

const tools = [
  { title: 'Ground Piece', tool: Tools.GroundTile, img: groundImg },

  { title: 'Water Piece', tool: Tools.SeaTile, img: waterImg },

  { title: 'Sharks', tool: Tools.Sharks, img: skarkImg },

  { title: 'Hole', tool: Tools.Hole, img: holeImg },
  { title: 'Eraser', tool: Tools.Eraser, img: eraserImg },
];

function ToolBox({}: Props) {
  const dispatch = useDispatch();
  const selectedTool = useSelector<RootState, Tools | undefined>(
    (state) => state.toolBox.selectedTool,
  );

  return (
    <Root>
      {tools.map((tool, index) => (
        <div className="tool" key={index}>
          <Tool
            title={tool.title}
            img={tool.img}
            isSelected={tool.tool === selectedTool}
            onSelect={() => dispatch(setSelectedTool(tool.tool))}
          />
        </div>
      ))}
    </Root>
  );
}

export default ToolBox;
