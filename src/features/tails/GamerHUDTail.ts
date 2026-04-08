import { BaseTail } from "./BaseTail";
import { registerTail } from "./registry";

import vert from "./shaders/gamer-hud.vert.glsl?raw";
import frag from "./shaders/gamer-hud.frag.glsl?raw";

export class GamerHUDTail extends BaseTail {
  public getShaders() { return { vertex: vert, fragment: frag }; }
  public updateEffect(_dt: number): void {}
}

registerTail({
  id: "gamer-hud",
  name: "Gamer HUD",
  description: "Sharp, angular digital brackets snapping physically over time.",
  class: GamerHUDTail,
});
