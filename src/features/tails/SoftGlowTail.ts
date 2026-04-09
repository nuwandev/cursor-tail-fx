import { BaseTail } from "./BaseTail";
import { registerTail } from "./registry";

import vert from "./shaders/soft-glow.vert.glsl?raw";
import frag from "./shaders/soft-glow.frag.glsl?raw";

export class SoftGlowTail extends BaseTail {
  public getShaders() {
    return { vertex: vert, fragment: frag };
  }
  public updateEffect(_dt: number): void {
    // specific per-frame logic (if any)
  }
}

registerTail({
  id: "soft-glow",
  name: "Soft Glow",
  description: "A warm, gentle diffusion trail with slow expansion.",
  class: SoftGlowTail,
});
