export enum Tiles {
  Sea = 1,
  Ground,
}

export enum TileEffects {
  Portal = 1,
  Hole,
  Flag,
}

export interface Tile {
  type: Tiles;
  effect: TileEffects | null;
}
