import { BaseTail } from "./BaseTail";
import { registerTail } from "./registry";

import auroraVert from "./shaders/aurora.vert.glsl?raw";
import auroraFrag from "./shaders/aurora.frag.glsl?raw";

export class AuroraTail extends BaseTail {
  public getShaders() {
    return {
      vertex: auroraVert,
      fragment: auroraFrag,
    };
  }

  public updateEffect(_dt: number): void {}
}

registerTail({
  id: "aurora",
  name: "Aurora Borealis",
  description: "A shimmering, colour-cycling curtain of light inspired by the northern lights",
  creator: { name: "nuwandev" },
  class: AuroraTail,
});
