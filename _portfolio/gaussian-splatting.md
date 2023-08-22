---
title: "Web viewer for Gaussian splatting NeRFs"
excerpt: "<img src='/images/gaussiansplatting-teaser.png' height='200' width='200'><br/>An interactive renderer for Gaussian splatting NeRFs written in WebGPU."
collection: portfolio
---

[Here](/assets/gaussianviewer/index.html) is a website which allows client-side interactive rendering of NeRFs created with [Gaussian splatting](https://github.com/graphdeco-inria/gaussian-splatting). The source code is available [here](https://github.com/cvlab-epfl/gaussian-splatting-web).

![Teaser](/images/gaussiansplatting-teaser.png)

## Usage
> This code uses the [WebGPU](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API) API which is not yet supported in all browers - at the time of writing you need a recent version of desktop Chrome/Edge or Firefox Nightly. See the full compatibility table [here](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API#browser_compatibility).

Training a NeRF with the original Gaussian Splatting (GS) code creates a number of files. Of importance are two: the point cloud in `.ply` format and camera metadata in `.json` format. Example files are available [from my Google Drive](https://drive.google.com/drive/folders/1tGsWJwoIi20T9TqPYBk7kJh1jPfh8lQE?usp=drive_link) or from the [authors of the original paper](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/datasets/pretrained/models.zip).

1. Pick the `.ply` via the button in top-right.
2. (Optional) Pick the corresponding `cameras.json` file with the other button. This is not necessary but the default camera location may be far from any sensible viewpoint.

The camera can be controlled in two ways: by picking a predefined camera from the list (requires loading `cameras.json`) or with interactive controls - W/S to move up/down image plane, A/D to move left/right, mouse wheel to move perpendicular. Mouse click+drag to rotate the camera (pitch/yaw).

## Background and design
This project was born out of my desire to try how far can I get in a new territory (webdev, 3d graphics, typescript, WebGPU) with the help of ChatGPT. Turns out quite far, but ChatGPT's role was more of a tutor helping with the APIs, than as a programmer writing the code for me. I initially tried to directly translate the original code to WebGPU compute shaders (hence the choice of WebGPU over WebGL) which worked but was painfully slow without efficient GPU depth sort and pruning. Since writing such a sort algorithm seemed difficult I instead changed the paradigm to express the original algorithm in terms of standard rasterization primitives. In short, the Gaussians are depth-sorted on CPU and then drawn in front-to-back order as flat quads (rectangles composed of two triangles), with the vertex shader responsible for painting the 2d Gaussian on each. With some abuse of the blending options it's possible to recreate the usual alpha-dependant color accumulation rule of NeRFs with raster graphics.

## Known issues
My lack of experience and limited time means a number of bugs and to-dos. I am happy to take PRs with fixes and missing functionality.

* **Low FPS**. There are two particularly slow steps in the code. My informal benchmarking suggests that 1. is a much bigger factor than 2.
    1. Sorting the Gaussians by depth on CPU, for each rendered frame. This can be fixed by implementing a GPU sort as a compute shader and outputting the order to an index buffer. The calls to [`draw`](https://developer.mozilla.org/en-US/docs/Web/API/GPURenderPassEncoder/draw) can then be replaced with [`drawIndexed`](https://developer.mozilla.org/en-US/docs/Web/API/GPURenderPassEncoder/drawIndexed). To avoid CPU->GPU roundtrips
    2. Rendering the Gaussians individually (-> #draw calls = #gaussians). This seems unavoidable without loss of quality but tradeoffs may be possible. One choice is to replace `draw` with `drawIndexed` (as above, regardless where the index buffer is computed) and draw the quads in groups of N, instead of one-by-one.
* **Memory consumption**. The NeRFs can be quite big (with many Gaussians) and possibly cause your machine to run out of memory. This could be mitigated by storing color information in 16-bit precision or simply reducing the degree of spherical harmonics in your scene.
* **Error converting 3rd degree spherical harmonics to color**. There is an issue converting 3rd degree spherical harmonics to RGB, resulting in strongly negative values. Preliminary debugging suggests this may be an issue with memory layout or WebGPU implementation in Chrome, as the code tested in separation works as intended.
* **Drifting orbit controls**. The orbit controls for interactive naviation are not very well thought-out and may cause drift over time, in particular of the "upwards" direction. The easy workaround is to just reset to a predefined camera from `cameras.json`.
* **Possibly lacking error handling**. With my poor TypeScript background I have likely missed multiple conditions where exceptions may be thrown, resulting in quiet entries in the javascript console rather than clear pop-ups for the user.