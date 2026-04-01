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

  public updateEffect(_dt: number): void {
    // OrbTail-specific per-frame logic (if any)
  }
}

registerTail({
  id: "orb",
  name: "Orb",
  description: "Floating orb effect",
  class: OrbTail,
});
