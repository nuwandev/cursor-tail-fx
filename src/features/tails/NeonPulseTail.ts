import { BaseTail } from "./BaseTail";
import { registerTail } from "./registry";

import vert from "./shaders/neon-pulse.vert.glsl?raw";
import frag from "./shaders/neon-pulse.frag.glsl?raw";

export class NeonPulseTail extends BaseTail {
  public getShaders() {
    return {
      vertex: vert,
      fragment: frag,
    };
  }

  public updateEffect(_dt: number): void {
    // No-op
  }
}

registerTail({
  id: "neon-pulse",
  name: "Neon Pulse",
  description: "An energetic, futuristic, pulsing neon trail.",
  creator: { name: "nuwandev" },
  class: NeonPulseTail,
});
