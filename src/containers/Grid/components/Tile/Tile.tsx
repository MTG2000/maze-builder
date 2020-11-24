import React, { useEffect, useRef } from 'react';
import { Tile, Tiles, TileEffects } from 'src/core/models/Tile';
import { HoverColors } from '../../service';
import groundImg from 'src/assets/ground-tile.png';
import waterImg from 'src/assets/water-tile.png';
import skarkImg from 'src/assets/shark.png';
import holeImg from 'src/assets/hole.png';
import { isNullOrUndefined } from 'util';
import { Root } from './style';

interface Props {
  index: number;
  tile: Tile | null;
  isHovering?: boolean;
  hoverColor?: HoverColors;
  onHover: (index: number) => void;
  onClick: (index: number) => void;
}

function Tile({
  index,
  tile,
  isHovering,
  hoverColor,
  onHover,
  onClick,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = () => {
      onHover(index);
    };
    ref.current?.addEventListener('mouseenter', handler);

    return () => ref.current?.removeEventListener('mouseenter', handler);
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
    if (tile?.effect === TileEffects.Sharks) effectImg = skarkImg;
    else if (tile?.effect === TileEffects.Hole) effectImg = holeImg;
  }

  return (
    <Root
      color={color}
      cursor={cursor}
      ref={ref}
      onClick={() => onClick(index)}
    >
      {tile && <img className="tile-img" src={tileImg} alt="" />}
      {tile?.effect && <img className="effect-img" src={effectImg} alt="" />}
    </Root>
  );
}

export default Tile;
