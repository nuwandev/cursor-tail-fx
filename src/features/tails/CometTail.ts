import { BaseTail } from "./BaseTail";
import { registerTail } from "./registry";

import cometVert from "./shaders/comet.vert.glsl?raw";
import cometFrag from "./shaders/comet.frag.glsl?raw";

export class CometTail extends BaseTail {
  public getShaders() {
    return {
      vertex: cometVert,
      fragment: cometFrag,
    };
  }

  public updateEffect(_dt: number): void {
    // CometTail-specific per-frame logic (if any)
  }
}

registerTail({
  id: "comet",
  name: "Comet",
  description: "A comet-like trail",
  class: CometTail,
});
