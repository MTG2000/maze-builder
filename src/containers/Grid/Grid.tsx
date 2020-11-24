import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from 'src/core/store/rootReducer';
import { Tile } from 'src/core/models/Tile';
import TileComponent from './components/Tile/Tile';
import { HoverColors, getHoverColor } from './service';
import { setTile } from 'src/core/store/slices/grid.slice';
import { isNullOrUndefined } from 'util';
import { Tools } from 'src/core/models/Tools';

interface Props {}

const Root = styled.div<{ tileWidth: number; width: number }>`
  position: relative;
  width: ${(props) => props.width}px;
  min-height: ${(props) => props.width}px;
  margin: auto;
  background: #fff4e4de;
  display: flex;
  flex-wrap: wrap;
  border-radius: 10px;
  overflow: hidden;
  user-select: none;

  .tile {
    width: ${(props) => props.tileWidth}px;
    height: ${(props) => props.tileWidth}px;
  }
`;

function Grid({}: Props) {
  // What tile are we currently hovering on
  const [tileHoveringOn, setTileHoveringOn] = useState(-1);
  const ref = useRef<HTMLDivElement | null>(null);
  const dispatch = useDispatch();
  const { dimension, grid } = useSelector((state: RootState) => state.grid);
  const selectedTool = useSelector<RootState, Tools | undefined>(
    (state) => state.toolBox.selectedTool,
  );

  const gridWidth = Math.min(window.innerWidth, window.innerHeight) * 0.9;

  useEffect(() => {
    ref.current?.addEventListener('mouseleave', () => {
      setTileHoveringOn(-1);
    });
    return () => {};
  }, []);

  const gridFalttened = grid.flat();
  let hoverColor: HoverColors | undefined;

  if (tileHoveringOn !== -1) {
    const gridTile = gridFalttened[tileHoveringOn];
    hoverColor = getHoverColor(gridTile, selectedTool);
  }

  const handleHover = (index: number) => {
    setTileHoveringOn(index);
  };

  const handleClick = (index: number) => {
    if (!isNullOrUndefined(selectedTool))
      dispatch(setTile({ index, selectedTool }));
  };

  return (
    <Root width={gridWidth} tileWidth={gridWidth / dimension} ref={ref}>
      {gridFalttened.map((tile, index) => (
        <div className="tile" key={index}>
          <TileComponent
            isHovering={index === tileHoveringOn}
            hoverColor={hoverColor}
            tile={tile}
            index={index}
            onHover={handleHover}
            onClick={handleClick}
          />
        </div>
      ))}
    </Root>
  );
}

export default Grid;
