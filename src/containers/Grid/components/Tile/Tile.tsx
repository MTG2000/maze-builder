import React, { useEffect, useRef } from 'react';
import { Tile as ITile, Tiles, TileEffects } from 'src/core/models/Tile';
import { HoverColors } from '../../service';
import groundImg from 'src/assets/ground-tile.png';
import waterImg from 'src/assets/water-tile.png';
import portalImg from 'src/assets/portal.png';
import flagImg from 'src/assets/flag.png';

import holeImg from 'src/assets/hole.png';
import { isNullOrUndefined } from 'util';
import { Root } from './style';

interface Props {
  index: number;
  tile: ITile | null;
  isHovering?: boolean;
  isPath?: boolean;
  hoverColor?: HoverColors;
  onHover: (index: number) => void;
  onClick: (index: number) => void;
}

function Tile({
  index,
  tile,
  isHovering,
  isPath,
  hoverColor,
  onHover,
  onClick,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const hoverHandler = () => {
      onHover(index);
    };
    const clickHandler = () => {
      onClick(index);
    };
    ref.current?.addEventListener('mouseenter', hoverHandler);
    ref.current?.addEventListener('mousedown', clickHandler);

    return () => {
      ref.current?.removeEventListener('mouseenter', hoverHandler);
      ref.current?.removeEventListener('mousedown', clickHandler);
    };
  }, []);

  let color = 'transparent';
  let cursor = 'cell';
  if (isHovering) {
    if (hoverColor === HoverColors.Add) color = '#4caf50';
    else if (hoverColor === HoverColors.Remove) color = '#f6392b';
    else if (hoverColor === HoverColors.Prevented) {
      color = '#9e9e9e';
      cursor = 'not-allowed';
    }
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

  return (
    <Root color={color} cursor={cursor} ref={ref} data-testid="tile">
      {tile && <img className="tile-img" src={tileImg} alt="" />}
      {tile?.effect && <img className="effect-img" src={effectImg} alt="" />}
      {isPath && <span className="path"></span>}
    </Root>
  );
}

export default Tile;
