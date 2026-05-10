import { BaseTail } from "./BaseTail";
import { registerTail } from "./registry";

import inkDropVert from "./shaders/ink-drop.vert.glsl?raw";
import inkDropFrag from "./shaders/ink-drop.frag.glsl?raw";

export class InkDropTail extends BaseTail {
  public getShaders() {
    return {
      vertex: inkDropVert,
      fragment: inkDropFrag,
    };
  }

  public updateEffect(_dt: number): void {}
}

registerTail({
  id: "ink-drop",
  name: "Ink Drop",
  description: "Blooming ink drops that bleed outward and dilute to white as they age",
  creator: { name: "nuwandev" },
  class: InkDropTail,
});
