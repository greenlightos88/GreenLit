import type { Renderer } from "@react-three/fiber";
import * as THREE from "three";

type AdaptiveRendererProps = Omit<THREE.WebGLRendererParameters, "canvas"> & {
  canvas: HTMLCanvasElement | EventTarget;
};

/** Prefer WebGPU when adapter initialization succeeds; always retain WebGL. */
export async function createAdaptiveRenderer(
  props: AdaptiveRendererProps,
): Promise<Renderer> {
  const hasWebGpu = Boolean((navigator as Navigator & { gpu?: unknown }).gpu);
  if (hasWebGpu) {
    try {
      const { WebGPURenderer } = await import("three/webgpu");
      const renderer = new WebGPURenderer({
        canvas: props.canvas as HTMLCanvasElement,
        antialias: true,
        alpha: true,
      });
      await renderer.init();
      return renderer as unknown as Renderer;
    } catch {
      // Adapter access can be denied even when navigator.gpu exists.
    }
  }
  return new THREE.WebGLRenderer({
    ...props,
    canvas: props.canvas as HTMLCanvasElement,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
}
