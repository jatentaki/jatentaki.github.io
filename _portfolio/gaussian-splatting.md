---
title: "Web viewer for Gaussian splatting NeRFs"
excerpt: "An interactive renderer for Gaussian splatting NeRFs written in WebGPU."
collection: portfolio
header:
    overlay_image: gaussiansplatting-teaser.png
---

<p style='text-align: center; text-transform: uppercase; font-size: 40px;'><a style='text-decoration: none;' href='/assets/gaussianviewer/index.html'>Link to the renderer</a></p>

I'm happy to present a <a href='/assets/gaussianviewer/index.html'>website</a> which allows client-side interactive rendering of NeRFs created with [Gaussian splatting](https://github.com/graphdeco-inria/gaussian-splatting). The source code is available [here](https://github.com/cvlab-epfl/gaussian-splatting-web).

## Usage
> This code uses the [WebGPU](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API) API which is not yet widely supported. You will need a recent version of Chrome (or other Chromium-based browser), see [compatibility](#compatibility) for details.

Training a NeRF with the original Gaussian Splatting (GS) code creates a number of files. Of importance are two: the point cloud in `.ply` format and camera metadata in `.json` format. Example files are available [from my Google Drive](https://drive.google.com/drive/folders/1tGsWJwoIi20T9TqPYBk7kJh1jPfh8lQE?usp=drive_link) or from the [authors of the original paper](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/datasets/pretrained/models.zip).

1. Pick the `.ply` via the button in top-right.
2. (Optional) Pick the corresponding `cameras.json` file with the other button. This is not necessary but the default camera location may be far from any sensible viewpoint.

The camera can be controlled in two ways: by picking a predefined camera from the list (requires loading `cameras.json`) or with interactive mouse/keyboard controls. See the instructions on the bottom right of the renderer window.

## Compatibility
The official compatiblity table of WebGPU can be found [here](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API#browser_compatibility). In practice, the following are known to work:

**MacOS**: works with recent (version 115+) Chrome/Chromium browsers.

**Windows**: works with Edge 116+, most likely with Chrome/Chromium as well (it's the same thing but I was not able to test).

**Ubuntu**: works with Chrome dev version and custom flags. The steps are as follows:
1. Download and install [Chrome dev](https://www.google.com/chrome/dev/).
2. Launch from command line with extra flags: `google-chrome-unstable --enable-features=Vulkan,UseSkiaRenderer`.
3. Go to `chrome://flags/#enable-unsafe-webgpu` and enable webgpu. Restart the browser for the change to take effect, make sure to use the flags from the previous step as well.
4. The Gaussian viewer should work.

**Firefox**: the nightly channel is supposed to support webGPU experimentally but in practice it fails on parsing my shaders across MacOS/Ubuntu.

> If you succeed with any other configuration or fail with the ones described above, please [open an issue](https://github.com/cvlab-epfl/gaussian-splatting-web/issues) and tell us.

## Background and design
This project was born out of my desire to try how far can I get in a new territory (webdev, 3d graphics, typescript, WebGPU) in a short amount of time. I initially tried to directly translate the original code to WebGPU compute shaders (hence the choice of WebGPU over WebGL) which worked but was painfully slow without efficient GPU depth sort and pruning. Since writing such a sort algorithm seemed difficult I instead changed the paradigm to express the original algorithm in terms of standard rasterization primitives. In short, the Gaussians are depth-sorted on CPU and then drawn in front-to-back order as flat quads (rectangles composed of two triangles), with the vertex shader responsible for painting the 2d Gaussian on each. With some abuse of the blending options it's possible to recreate the usual alpha-dependant color accumulation rule of NeRFs with raster graphics.

## Known issues
My lack of experience and limited time means a number of bugs and to-dos. I am happy to take PRs with fixes and missing functionality.

* **Memory consumption**. The NeRFs can be quite big (with many Gaussians) and possibly cause your machine to run out of memory. This could be mitigated by storing color information in 16-bit precision or simply reducing the degree of spherical harmonics in your scene.
* **Possibly lacking error handling**. With my poor TypeScript background I have likely missed multiple conditions where exceptions may be thrown, resulting in quiet entries in the javascript console rather than clear pop-ups for the user.