export type InputAction =
  | { type: 'remove_top_layer'; pileId: string }
  | { type: 'pick_mushroom'; mushroomId: string };

export class InputSystem {
  createPileTapAction(pileId: string): InputAction {
    return { type: 'remove_top_layer', pileId };
  }

  createMushroomTapAction(mushroomId: string): InputAction {
    return { type: 'pick_mushroom', mushroomId };
  }
}
