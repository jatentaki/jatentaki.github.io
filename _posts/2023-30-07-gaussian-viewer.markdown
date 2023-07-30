---
layout: post
title:  "Web viewer for Gaussian Splatting NeRFs"
date:   2023-30-07 15:40:00 +0100
categories: data-vis
---
[![A screenshot of the visualization](/assets/gsviewer-thumbnail.png "Screenshot of the viewer GUI")](https://jatentaki.github.io/gaussianviewer)


# Gaussian Splatting NeRF viewer
You may have heard about the SIGGRAPH 2023 best paper awardee: [3D Gaussian Splatting for Real-Time Radiance Field Rendering](https://github.com/graphdeco-inria/gaussian-splatting). Their method delivers excellent visual quality with fast training and real time rendering. Unfortunately, their rendering code relies on CUDA making it inconvenient to use. This project aims to deliver viewing capabilities on broad consumer devices. [This project](https://jatentaki.github.io/gaussianviewer) implements the renderer in [WebGPU](https://en.wikipedia.org/wiki/WebGPU) enabling interactive usage on consumer devices (currently chrome version 113+). This is an early proof of concept, providing at best 5fps on my M1 MacBook, but there is space for performance improvements.

#### Motivation
1. Share my excitement about the NeRFs with my CUDA-less friends.
2. See how far I can get with a completely unfamiliar technology and stack (3d graphics, typescript, webGPU) using chatGPT as my tutor.

#### Implementation
This code is available at [TODO](TODO). For performance, this code uses a different technique than the original paper. Instead of using compute shaders and rendering the scene pixel-by-pixel, enumerating the Gaussians each time, I adapt the algorithm to fit a standard vertex/fragment 3d pipeline. In vertex shader I convert the Gaussians into camera-facing quads and in fragment shader I draw a 2d Gaussian over each quad. This approach requires sorting the quads by depth and issuing draw calls one-by-one, which is not very scalable but apparently better than using a webGPU compute shader naively. I believe the main bottleneck to be CPU sorting, so moving that to GPU could enable a reasonable viewing experience.

#### TODOs
1. By far the biggest gain is by implementing quad sorting on GPU, avoiding device-host roundtrips and slow JS numerics.
2. Currently quads are drawn one-by-one. This does not appear to be a great performance slowdown but [`drawIndexed`](https://developer.mozilla.org/en-US/docs/Web/API/GPURenderPassEncoder/drawIndexed) may be a way to trade accuracy for performance, simply drawing larger numbers of quads per GPU call.