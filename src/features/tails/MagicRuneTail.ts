import { BaseTail } from "./BaseTail";
import { registerTail } from "./registry";

import vert from "./shaders/magic-rune.vert.glsl?raw";
import frag from "./shaders/magic-rune.frag.glsl?raw";

export class MagicRuneTail extends BaseTail {
  public getShaders() {
    return { vertex: vert, fragment: frag };
  }
  public updateEffect(_dt: number): void {}
}

registerTail({
  id: "magic-rune",
  name: "Magic Rune",
  description: "Mystical swirling symbols orbiting in space.",
  creator: { name: "nuwandev" },
  class: MagicRuneTail,
});
