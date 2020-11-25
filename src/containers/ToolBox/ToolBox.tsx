import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedTool } from 'src/core/store/slices/toolbox.slice';
import Tool from './components/Tool/Tool';
import { RootState } from 'src/core/store/rootReducer';
import { Tools } from 'src/core/models/Tools';
import { Root } from './style';

import groundImg from 'src/assets/tile-ground.png';
import waterImg from 'src/assets/tile-water.png';
import portalImg from 'src/assets/portal.png';
import flagImg from 'src/assets/flag.png';
import holeImg from 'src/assets/hole.png';
import eraserImg from 'src/assets/eraser.png';

interface Props {}

const tools = [
  { title: 'Ground Piece', tool: Tools.GroundTile, img: groundImg },
  { title: 'Water Piece', tool: Tools.SeaTile, img: waterImg },
  { title: 'Portal', tool: Tools.Portal, img: portalImg },
  { title: 'Hole', tool: Tools.Hole, img: holeImg },
  { title: 'Start/End', tool: Tools.Flag, img: flagImg },
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
