import React, { useEffect, useRef } from 'react';
import { Tile as ITile, Tiles, TileEffects } from 'src/core/models/Tile';
import { HoverStates, getHoverState } from '../../service';
import groundImg from 'src/assets/ground-tile.png';
import waterImg from 'src/assets/water-tile.png';
import portalImg from 'src/assets/portal.png';
import flagImg from 'src/assets/flag.png';
import holeImg from 'src/assets/hole.png';
import { isNullOrUndefined } from 'util';
import { Root } from './style';
import { useSelector } from 'react-redux';
import { RootState } from 'src/core/store/rootReducer';
import { Tools } from 'src/core/models/Tools';

interface Props {
  index: number;
  tile: ITile | null;
  isPath?: boolean;
  hoverState?: HoverStates;
  onHover: (index: number) => void;
  onClick: (index: number) => void;
}

function Tile({ index, tile, isPath, onHover, onClick }: Props) {
  const ref = useRef<HTMLButtonElement | null>(null);

  const selectedTool = useSelector<RootState, Tools | undefined>(
    (state) => state.toolBox.selectedTool,
  );

  const hoverState = getHoverState(tile, selectedTool);

  useEffect(() => {
    const hoverHandler = () => {
      onHover(index);
    };
    const clickHandler = () => {
      onClick(index);
    };
    ref.current?.addEventListener('mouseenter', hoverHandler);
    // ref.current?.addEventListener('mousedown', clickHandler);

    return () => {
      ref.current?.removeEventListener('mouseenter', hoverHandler);
      // ref.current?.removeEventListener('mousedown', clickHandler);
    };
  }, []);

  let hoverColor = 'transparent';
  let cursor = 'cell';
  if (hoverState === HoverStates.Add) hoverColor = '#4caf50';
  else if (hoverState === HoverStates.Remove) hoverColor = '#f6392b';
  else if (hoverState === HoverStates.Prevented) {
    hoverColor = '#9e9e9e';
    cursor = 'not-allowed';
  }

  let tileImg;
  let effectImg;
  if (tile) {
    if (tile.type === Tiles.Ground) tileImg = groundImg;
    else if (tile.type === Tiles.Sea) tileImg = waterImg;
  }

  if (!isNullOrUndefined(tile?.effect)) {
    if (tile?.effect === TileEffects.Portal) effectImg = portalImg;
    else if (tile?.effect === TileEffects.Hole) effectImg = holeImg;
    else if (tile?.effect === TileEffects.Flag) effectImg = flagImg;
  }

  let tileTypeLabel = 'Water';

  if (tile?.type === Tiles.Ground) {
    if (tile?.effect === TileEffects.Portal) tileTypeLabel = 'Portal';
    else if (tile?.effect === TileEffects.Hole) tileTypeLabel = 'Hole';
    else if (tile?.effect === TileEffects.Flag) tileTypeLabel = 'Flag';
    else tileTypeLabel = 'Ground';
  }

  return (
    <Root
      hoverColor={hoverColor}
      cursor={cursor}
      data-testid="tile"
      onClick={() => {
        onClick(index);
      }}
    >
      {tile && <img className="tile-img" src={tileImg} alt="" />}
      {tile?.effect && <img className="effect-img" src={effectImg} alt="" />}
      {isPath && <span className="path"></span>}
    </Root>
  );
}

export default Tile;
