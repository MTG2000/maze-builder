import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from 'src/core/store/rootReducer';
import { Tile } from 'src/core/models/Tile';
import TileComponent from './components/Tile/Tile';
import { HoverColors, getHoverColor } from './service';
import { setTile, setPath } from 'src/core/store/slices/grid.slice';
import { isNullOrUndefined } from 'util';
import { Tools } from 'src/core/models/Tools';
import { Root } from './style';
import StartButton from './components/StartButton/StartButton';
import { findPath } from 'src/core/services/pathFinding';

interface Props {}

function Grid({}: Props) {
  const [tileHoveringOn, setTileHoveringOn] = useState(-1);
  const [searching, setSearching] = useState(false);
  const dispatch = useDispatch();
  const { dimension, grid, showBorders, path, flagsIndecies } = useSelector(
    (state: RootState) => state.grid,
  );

  const canStartSearch = flagsIndecies[0] !== -1 && flagsIndecies[1] !== -1;

  const selectedTool = useSelector<RootState, Tools | undefined>(
    (state) => state.toolBox.selectedTool,
  );

  const ref = useRef<HTMLDivElement | null>(null);
  const selectedToolRef = useRef(selectedTool);

  const gridWidth = Math.min(window.innerWidth, window.innerHeight) * 0.8;

  useEffect(() => {
    const handler = () => {
      setTileHoveringOn(-1);
    };
    ref.current?.addEventListener('mouseleave', handler);
    return () => ref.current?.removeEventListener('mouseleave', handler);
  }, []);

  useEffect(() => {
    selectedToolRef.current = selectedTool;
  }, [selectedTool]);

  const gridFalttened = grid.flat();
  let hoverColor: HoverColors | undefined;

  if (tileHoveringOn !== -1) {
    const gridTile = gridFalttened[tileHoveringOn];
    hoverColor = getHoverColor(gridTile, selectedTool);
  }

  const handleTileHover = (index: number) => {
    setTileHoveringOn(index);
  };

  const handleTileClick = (index: number) => {
    if (!isNullOrUndefined(selectedToolRef.current))
      dispatch(setTile({ index, selectedTool: selectedToolRef.current }));
  };

  const handleSearchStart = async () => {
    setSearching(true);
    const result = await findPath(
      grid,
      flagsIndecies[0],
      flagsIndecies[1],
      dimension,
    );
    if (result) dispatch(setPath(result.path));
    setSearching(false);
  };

  return (
    <Root
      width={gridWidth}
      tileWidth={gridWidth / dimension}
      ref={ref}
      showBorders={showBorders}
    >
      {canStartSearch && (
        <StartButton loading={searching} onClick={handleSearchStart} />
      )}
      {gridFalttened.map((tile, index) => (
        <div className="tile" key={index}>
          <TileComponent
            isHovering={index === tileHoveringOn}
            isPath={path[index]}
            hoverColor={hoverColor}
            tile={tile}
            index={index}
            onHover={handleTileHover}
            onClick={handleTileClick}
          />
        </div>
      ))}
    </Root>
  );
}

export default Grid;
