# metacollector generative collection canvas

This is a template that you can use as a starting point to create and test your own metacollector **collection canvas** generator.

A metacollector **collection canvas generator** is a **generative viewer** that collectors use to see their metacollector art fragment collection recomposed and recombined into a unique generative artwork: their collection canvas!

The initial official collection canvas is hosted at https://metacollector.art (it's different from the newer one in this repository created by @pifragile)

This template has been possible thanks to the collaboration with @pifragile, who created the sketch and gave a lot of feedback on how to improve the developer experience 🙏

Please check the [Generative Canvas Guidelines](#metacollector-generative-canvas-guidelines) below for useful development tips and design ruless👇

## How to create your own metacollector collection canvas generator?

- clone the repository
- modify collectioncanvas/sketch.js (the example generative canvas)
- that's it! 

The example canvas generator in this repository use p5.js but you can very well use anything that write into an HMTL canvas, including JavaScript without any library.

<img width="500" alt="Capture d’écran 2022-03-15 à 16 36 16" src="https://user-images.githubusercontent.com/109677/158415352-9ca90525-c93d-4cd2-bd3d-392c0fcdd5af.png">

## A few metacollector collections to check
Julien https://metacollector.art/?collectoraddress=tz1VhN58tCJbboQQoyTgLWoCwDUXBidfcAgd

@cabline1 https://metacollector.art/?collectoraddress=tz1T4vkx4aqjbVSysTv8pSp4UPSrVCizMzc7

@emmanuel_2m https://metacollector.art/?collectoraddress=tz1gLoBxgJG2EstESmyx1ooybVWr7rwHps96

@pifragile https://metacollector.art/?collectoraddress=tz1gJde57Meuqb2xMYbapTPzgTZkiCmPAMZA 

# metacollector Generative Canvas Guidelines

## How to make sure your generative canvas is a good collector experience

### Collector Experience
  - Be sure that the collector can recognize their collection 
  
  - Reflect the actual number of fragments they collected
  
  - Avoid doing things that the collector may think are bugs or data errors (like duplicating a fragment, showing just half of a fragment as if it was cut, changing the fragments size ratio)
  
  - Draw a visibly empty, but yet still interesting background if metacollector.artfragments list is empty!
   
    - The goal is to avoid confusion from the collector: no background would be seen as a bug, but if your background is to involved and loaded with details, it could not make immediate sense that it is incomplete without fragments
    
  - Create a surprising difference between collection: 
    - make adding or removing a fragment from one's wallet surprising. Collecting a new fragment or selling one should lead to interesting changes
    - two collections with the same fragments collected should still have surprising differences because they come from different wallets

  - Create a new, visibly changed iteration of the canvas when the collector move to another iteration of the canvas (ie. draw different version for different iteration numbers)
    
### Development Guidelines
  - Use the `size` value (0 to 1 value) of fragments indicated in metadata attributes to size the fragments relatively to each others. You might have a reason to ignore it if you have a very specific artistic goal, but always try to think from the perspective of the collector and how they might perceive the integrity of their collection.

  - Use the `direction` value (0 to 2*Pi, radian angle) as the initial angle of the fragments 

  - Be sure that your generative code is deterministic: your Generative Canvas should always produces the same output from the same inputs. However, a change in the inputs should create a different output. 

  - Make sure to use a deterministic random number generator (RNG) instead of Math.random (ie. your RNG must be seeded by either the wallet address or the metacollector.seed that is already derived from the wallet address for you). For example:

      - p5.js random number generator: use `randomSeed(metacollector.seed)` at the start of your drawing
      - alea.js. Fast and you can pass it the wallet address directly if you want.

 - Use `metacollector.iteration` as a way to generate a new, deterministic version of the collector's collection.
 	- you can use the iteration number to advance along a deterministic algorithm or deterministic generative path
 	- or you could for example add the number to the random seed before seeding the random generator

 - Be sure that your drawing is size independent (ie. look the same whatever the canvas size in pixel is). One way to do that is to do calculate all your positions and sizes using normalized coordinates (between 0 and 1), separating calculations and drawing, and only when it's time for actually drawing, multiply by the canvas pixel size
    - If you use p5.js, use drawingContext.canvas.width an drawingContext.canvas.height instead of the width and height global values created by p5.js.
    - Use them for calculating your drawing positions, as the canvas can change between drawings (ie. resizing)

 - Implement the paintCollection(metacollector) function in your script: If anything in the metacollector data changes (ex. wallet address, tokens loaded, iteration number…) the metacollector code will call this function and pass it the metacollector object.

  - If you use p5.js you should not use the automagic draw() function to draw, instead use one or several functions that are explicitly called only when needed by paintCollection()

 - Canvas will be resized by the metacollector code, you don't control its size. If you use p5.js, you need to use the resizeCanvas function to set the p5 internal canvas object properly `resizeCanvas(drawingContext.canvas.width, drawingContext.canvas.height, true)` before starting to draw. True here means noRedraw, don't redraw the canvas now.

### How to test
- For testing with real art fragment collections you can use Julien's canvas https://metacollector.art/?collectoraddress=tz1VhN58tCJbboQQoyTgLWoCwDUXBidfcAgd

- @cabline1 canvas: https://metacollector.art/?collectoraddress=tz1T4vkx4aqjbVSysTv8pSp4UPSrVCizMzc7

- @emmanuel_2m canvas:  https://metacollector.art/?collectoraddress=tz1T4vkx4aqjbVSysTv8pSp4UPSrVCizMzc7tz1gLoBxgJG2EstESmyx1ooybVWr7rwHps96

- @pifragile canvas https://metacollector.art/?collectoraddress=tz1gJde57Meuqb2xMYbapTPzgTZkiCmPAMZA

- @metacollector01 own's canvas. Hundreds of fragments. Interesting to test the pure limits of your collection canvas https://metacollector.art/?collectoraddress=tz1hJYLKMNffDWWamoXNNVSPXwAuNvVY9oii

- To test your local development version replace https://metacollector.art/ with your local server address, for example http://127.0.0.1:8000/ (simpleHTTP) or http://127.0.0.1:5500/ (p5 live server extension in vs code)

- I suggest using the p5.vscode extension if you use p5.js for your sketch and VS Code. It installs a simple to use server with live reloading
    - Create and manage p5.js projects.
    - VS Marketplace Link: https://marketplace.visualstudio.com/items?itemName=samplavigne.p5-vscode
