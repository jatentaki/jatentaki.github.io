---
layout: post
title:  "Public transport visualized"
date:   2018-12-09 18:04:12 +0100
categories: data-vis
---
[![A screenshot of the visualization](/assets/ztm_thumbnail.png "Visualization screenshot")](https://jatentaki.github.io/ztm)

Today I am revamping and re-releasing my first and only (so far) web project: the [visualization of public transportation in Warsaw](https://jatentaki.github.io/ztm). It is 3-piece monster:

1. [Raw data](ftp://rozklady.ztm.waw.pl/) is parsed and preprocessed by a bunch of ugly python scripts. The format is already pretty bad, and subway comes with its [own](http://www.metro.waw.pl/pliki/rozklady/rozklad_jazdy_M1_wrzesien%202018.xls) which adds another level of ugliness.
2. The data is served statically from github-pages and get to a rust WASM module, which does the heavy lifting of running Dijkstra's algorithm on this giant.
3. The output from Dijkstra is used to color the diagram, done with JS and Google maps API.
