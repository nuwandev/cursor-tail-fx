import { BaseTail } from "./BaseTail";
import { registerTail } from "./registry";

import vert from "./shaders/glass-fade.vert.glsl?raw";
import frag from "./shaders/glass-fade.frag.glsl?raw";

export class GlassFadeTail extends BaseTail {
  public getShaders() {
    return { vertex: vert, fragment: frag };
  }
  public updateEffect(_dt: number): void {}
}

registerTail({
  id: "glass-fade",
  name: "Glass Fade",
  description: "Ultra subtle transparent rim effect simulating a hollow tube.",
  creator: { name: "nuwandev" },
  class: GlassFadeTail,
});
