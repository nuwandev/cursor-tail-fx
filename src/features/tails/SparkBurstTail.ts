import { BaseTail } from "./BaseTail";
import { registerTail } from "./registry";

import vert from "./shaders/spark-burst.vert.glsl?raw";
import frag from "./shaders/spark-burst.frag.glsl?raw";

export class SparkBurstTail extends BaseTail {
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
  id: "spark-burst",
  name: "Spark Burst",
  description: "Snappy, celebratory, high-energy tiny sparkles.",
  creator: { name: "nuwandev" },
  class: SparkBurstTail,
});
