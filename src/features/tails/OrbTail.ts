import { BaseTail } from "./BaseTail";
import { registerTail } from "./registry";

import orbVert from "./shaders/orb.vert.glsl?raw";
import orbFrag from "./shaders/orb.frag.glsl?raw";

export class OrbTail extends BaseTail {
  public getShaders() {
    return {
      vertex: orbVert,
      fragment: orbFrag,
    };
  }

  public updateEffect(_dt: number): void {}
}

registerTail({
  id: "orb",
  name: "Orb",
  description: "Floating orb effect",
  creator: { name: "nuwandev" },
  class: OrbTail,
});
