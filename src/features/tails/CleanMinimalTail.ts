import { BaseTail } from "./BaseTail";
import { registerTail } from "./registry";

import vert from "./shaders/clean-minimal.vert.glsl?raw";
import frag from "./shaders/clean-minimal.frag.glsl?raw";

export class CleanMinimalTail extends BaseTail {
  public getShaders() {
    return {
      vertex: vert,
      fragment: frag,
    };
  }

  public updateEffect(_dt: number): void {}
}

registerTail({
  id: "clean-minimal",
  name: "Clean Minimal",
  description: "A calm, precise, unobtrusive elegant trace.",
  creator: { name: "nuwandev" },
  class: CleanMinimalTail,
});
