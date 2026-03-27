# Creating a Custom Tail in CursorTrail

This guide will walk you through the process of writing your own customized WebGL cursor tail for the application.

## Step 1: Extend `BaseTail.ts`
All trails are unified under the `BaseTail` interface logic, which automatically handles standard WebGL setups, event processing, screen sizes, and configuration payloads.

Create a new file in `src/core/tails/` for your effect (e.g., `CustomTail.ts`):

```typescript
import { BaseTail } from "./BaseTail";

export class CustomTail extends BaseTail {
    // We will define our shaders here!
}
```

## Step 2: Implement `getVertexShader`
The Vertex Shader decides where each specific particle renders and how large it is at a given moment in its life frame. You are provided with several inputs natively:
* `i_position`: Where the particle spawned.
* `i_velocity`: Velocity vector of the user's cursor when the particle spawned.
* `i_spawnTime` & `i_lifeTime`: Temporal tracking mechanisms.
* `u_time`: Current simulation time.

```typescript
protected getVertexShader(): string {
    return `#version 300 es
    in vec2 a_quadPos;
    in vec2 i_position;
    in vec2 i_velocity;
    in float i_spawnTime;
    in float i_lifeTime;
    in vec3 i_color;

    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_sizeMultiplier;
    uniform float u_lengthMultiplier;

    out vec4 v_color;
    out vec2 v_uv;

    void main() {
        float age = u_time - i_spawnTime;
        float expectedLife = max(i_lifeTime * u_lengthMultiplier, 0.001);
        float lifeRatio = age / expectedLife;
        
        if (lifeRatio < 0.0 || lifeRatio >= 1.0) {
            gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
            return;
        }
        
        // Let's create an expanding, shaky line!
        vec2 pos = i_position + i_velocity * (age / 1000.0);
        float size = 15.0 * u_sizeMultiplier * (lifeRatio * 2.0);
        float alpha = 1.0 - lifeRatio;
        
        // Final screen math mapping
        vec2 finalPos = pos + a_quadPos * size;
        vec2 clipSpace = vec2(
            (finalPos.x / u_resolution.x) * 2.0 - 1.0,
            1.0 - (finalPos.y / u_resolution.y) * 2.0
        );
        
        gl_Position = vec4(clipSpace, 0.0, 1.0);
        v_color = vec4(i_color, alpha);
        v_uv = a_quadPos;
    }
    `;
}
```

## Step 3: Implement `getFragmentShader`
The Fragment Shader governs exactly what each pixel of the instances quad looks like computationally. This receives data directly from your Vertex Shader outputs (`v_color`, `v_uv`, etc.).

```typescript
protected getFragmentShader(): string {
    return `#version 300 es
    precision mediump float;
    in vec4 v_color;
    in vec2 v_uv;

    uniform float u_opacityMultiplier;
    out vec4 outColor;

    void main() {
        float dist = length(v_uv);
        if (dist > 1.0) discard; // Clip to a circle 

        // Hard un-feathered glowing edge
        float glow = 1.0 - pow(dist, 4.0); 
        
        outColor = vec4(v_color.rgb * v_color.a * glow * u_opacityMultiplier, v_color.a * glow * u_opacityMultiplier);
    }
    `;
}
```

## Step 4: Register your Effect
Finally, you simply need to make the application aware of your new tail component!
1. **Overlay Registry**: In `src/windows/overlay/main.ts`, import your new `CustomTail.ts` and add it to the `createTail()` switch block.
2. **Settings UI**: Open `src/windows/settings/index.html` and append another `<label class="radio-card">` HTML block to the `effect-cards` grid mapping the `<input type="radio" value="custom">`.

That's it! Your customized cursor tail is fully functional and hooked directly into the Tauri app engine!
