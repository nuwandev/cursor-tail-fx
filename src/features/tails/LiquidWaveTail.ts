import { BaseTail } from "./BaseTail";
import { registerTail } from "./registry";

import vert from "./shaders/liquid-wave.vert.glsl?raw";
import frag from "./shaders/liquid-wave.frag.glsl?raw";

export class LiquidWaveTail extends BaseTail {
  public getShaders() { return { vertex: vert, fragment: frag }; }
  public updateEffect(_dt: number): void {}
}

registerTail({
  id: "liquid-wave",
  name: "Liquid Wave",
  description: "A continuous flowing, undulating ribbon of fluid motion.",
  class: LiquidWaveTail,
});
