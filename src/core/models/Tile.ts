export enum Tiles {
  Sea = 1,
  Ground,
}

export enum TileEffects {
  Sharks = 1,
  Hole,
}

export interface Tile {
  type: Tiles;
  effect: TileEffects | null;
}
