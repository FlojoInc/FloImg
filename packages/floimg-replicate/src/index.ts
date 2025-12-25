/**
 * floimg-replicate - Replicate AI model integration for floimg
 *
 * This package provides access to popular AI models hosted on Replicate:
 * - GFPGAN: Face restoration and enhancement
 * - DeOldify: Black & white image colorization
 * - Real-ESRGAN: High-quality image upscaling
 * - FLUX Kontext: Text-guided image editing
 *
 * @packageDocumentation
 */

export {
  replicateTransform,
  type ReplicateTransformConfig,
  faceRestoreSchema,
  colorizeSchema,
  realEsrganSchema,
  fluxEditSchema,
} from "./transforms.js";
