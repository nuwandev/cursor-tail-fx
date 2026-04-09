import { BaseTail } from "./BaseTail";
import { registerTail } from "./registry";

import vert from "./shaders/retro-pixel.vert.glsl?raw";
import frag from "./shaders/retro-pixel.frag.glsl?raw";

export class RetroPixelTail extends BaseTail {
  public getShaders() { return { vertex: vert, fragment: frag }; }
  public updateEffect(_dt: number): void {
    //specific per-frame logic (if any)
  }
}

registerTail({
  id: "retro-pixel",
  name: "Retro Pixel",
  description: "8-bit quantization with grid-aligned rigid snapping.",
  class: RetroPixelTail,
});
