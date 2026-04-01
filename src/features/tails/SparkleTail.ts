import { BaseTail } from "./BaseTail";
import { registerTail } from "./registry";

import sparkleVert from "./shaders/sparkle.vert.glsl?raw";
import sparkleFrag from "./shaders/sparkle.frag.glsl?raw";

export class SparkleTail extends BaseTail {
  public getShaders() {
    return {
      vertex: sparkleVert,
      fragment: sparkleFrag,
    };
  }

  public updateEffect(_dt: number): void {
    // SparkleTail-specific per-frame logic (if any)
  }
}

registerTail({
  id: "sparkle",
  name: "Sparkle",
  description: "Sparkly particle effect",
  class: SparkleTail,
});
