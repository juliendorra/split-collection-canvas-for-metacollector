
// if you use pure JavaScript (no p5.js) create and append the canvas you want to draw to once the document is ready

let canvas;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createCanvas);
} else {
    createCanvas();
}

function createCanvas() {
    canvas = document.createElement("canvas");
    document.getElementsByTagName("body")[0].append(canvas);
}

// the paintCollection() function is a hook that metacollector uses to call your sketch

// it will be called everytime your sketch must be drawn, and it receives the metacollector object:

// metacollector = {
//     walletAddress, // first 3 characters tz1 are always identical
//     seed, // positive integer, pre-hashed from wallet address as a convenience. Use it as the seed of your random number generator
//     random, // deterministic random function pre-seeded with walletAddress. Use metacollector.random instead of Math.random
//     iteration, // user can advance the iteration by clicking on the canvas. Iterations are bookmarkable and sharable as URL: #23
//     canvas: {
//          visualWidth,  // the visual size of the canvas, as set by metacollector
//          visualHeight,
//          pixelWidth = canvasWidth,  // the pixel size of the canvas
//          pixelHeight = canvasWidth
//       },
//     artfragments: [
//        {
//        imageP5, // p5.js image object, exists only if p5.js is detected in global context
//        imageBitmap, // imageBitmap, native JavaScript interface to store and draw images on canvas. Polyfilled on Safari <= 14
//        name, // public name of the fragment, several fragments can have the same
//        attributes: {
//                family,
//                size, // normalized [0, 1]
//                width, // calculated from image for convenience. The longest length is always equal to size 
//                height, // and thus normalized [0, 1]. Ex. width = 0.9 and height= 0.466
//                displayWidth, // Suggested pixel display size. 
//                displayHeight,  // Pre-calculated from width/height and canvas size for convenience
//                widthToHeightRatio,  // Multiply the width/displayWidth by this value to get the height. 
//                                     // Useful when scaling the the display size of a fragment, to keep the proportion right
//                direction, // in radians [0, 6.28]
//                speed, // normalized [0, 1]
//                influence, // normalized [0, 1]
//                energy, //normalized [0, 1]
//                colors: ["#FFFFFF", "#3400FF", …], // 5 colors
//          }
//        },
//        {…}, // another fragment
//        {…}
//      ]
//     }


function paintCollection(metacollector) {

    const width = canvas.width
    const height = canvas.height

    let ctx = canvas.getContext('2d');

    ctx.resetTransform()
    ctx.clearRect(0, 0, width, height)

    drawBackground(ctx, metacollector.random);

    // sorting the fragments from bigger to smaller
    metacollector.artfragments.sort((a, b) => {
        return b.attributes.size - a.attributes.size; // descending order sort
    })

    const totalFragments = metacollector.artfragments.length;
    const sliceWidth = width / totalFragments

    let positionX = width;
    let positionY = height / 2;

    ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height); // create a context covering the whole canvas for background fills

    for (let fragment of metacollector.artfragments) {

        let fragmentPixelWidth = fragment.attributes.displayWidth * 3;
        let fragmentPixelHeight = fragment.attributes.displayHeight * 3;

        if (fragmentPixelWidth > width * 3) {
            fragmentPixelWidth = width * 3;
            fragmentPixelHeight = fragmentPixelWidth * fragment.widthToHeightRatio;
        }

        const centerX = fragmentPixelWidth / 2;
        const centerY = fragmentPixelHeight / 2;

        positionX -= sliceWidth;
        positionY = (height / 2) - (height * (fragment.attributes.energy - 0.5));


        ctx.save(); // save point before changing origin and rotating the canvas

        ctx.translate(positionX, positionY)

        // introduce a slight rotation for each iteration (ie. when user click on canvas). Deterministic
        const clipRotate = (metacollector.randomIteration() - 0.5) * Math.PI / 18 //  10º range, -5º to 5º
        ctx.rotate(clipRotate)

        // Create a clipping paths
        let circlesPath = new Path2D();
        circlesPath.ellipse(
            0,
            -height * 0.2,
            sliceWidth * 1.2,
            height * 0.8,
            0,
            0, 2 * Math.PI); // could use direction as it's an angle
        circlesPath.ellipse(
            width * 0.1,
            height * 0.4,
            sliceWidth * 1.2,
            height * 0.8,
            6.2,
            0, 2 * Math.PI); // could use direction as it's an angle

        // fill the left of the clipping to avoid seing background on top with fragments and clip zone positioned at the bottom
        circlesPath.rect(
            -width,
            -height,
            width + (sliceWidth / 2),
            height * 3)

        // Set the clip to the circles
        ctx.clip(circlesPath);

        // fill with a color from the fragment attributes palette
        ctx.fillStyle = fragment.attributes.colors[2]
        ctx.fill()

        // make the background color more varied with some noise
        ctx.save();
        ctx.resetTransform()
        noisyCanvas = document.createElement("canvas");
        noisyCanvas.width = width / 4;
        noisyCanvas.height = height / 4;

        noisyCanvas = perlinNoise(noisyCanvas, metacollector.random);

        ctx.globalCompositeOperation = "luminosity"

        ctx.drawImage(noisyCanvas,
            0, 0,
            width,
            height
        )
        // restore to the slice translation and default composition
        ctx.restore();
        ctx.globalCompositeOperation = "source-over"

        ctx.rotate(fragment.attributes.direction);
        ctx.translate(-centerX, -centerY) // centering to center of image

        // introduce a shift in position for each iteration (ie. when user click on canvas). Deterministic
        const shiftX = (fragmentPixelWidth / 10) * (metacollector.randomIteration() - 0.5)
        const shiftY = (fragmentPixelHeight / 4) * (metacollector.randomIteration() - 0.5)
        ctx.translate(shiftX, shiftY)

        // draw fragment
        ctx.drawImage(fragment.imageBitmap,
            0, 0,
            fragmentPixelWidth,
            fragmentPixelHeight
        )

        ctx.restore(); // cancel all transformations for next fragment
    }
}

function drawBackground(ctx, random) {

    perlinNoise(ctx.canvas, random);
}

// modified from https://gist.github.com/donpark/1796361
/* Following canvas-based Perlin generation code originates from
 * iron_wallaby's code at: http://www.ozoneasylum.com/30982
 */
function randomNoise(canvas, random, x, y, width, height, alpha) {
    x = x || 0;
    y = y || 0;
    width = width || canvas.width;
    height = height || canvas.height;
    alpha = alpha || 60;
    random = random || Math.random // fallback to Math.random. A deterministic, seeded random is prefered
    var g = canvas.getContext("2d"),
        imageData = g.getImageData(x, y, width, height),
        random = random,
        pixels = imageData.data,
        n = pixels.length,
        i = 0;
    while (i < n) {
        pixels[i++] = pixels[i++] = pixels[i++] = (200 + random() * 55) | 0;
        pixels[i++] = alpha;
    }
    g.putImageData(imageData, x, y);
    return canvas;
}

function perlinNoise(canvas, random, noise) {
    random = random || Math.random // fallback to Math.random. Adeterministic, seeded random is prefered
    noise = noise || randomNoise(canvas, random);
    var g = canvas.getContext("2d");
    g.save();

    /* Scale random iterations onto the canvas to generate Perlin noise. */
    for (var size = 4; size <= noise.width; size *= 2) {
        var x = (random() * (noise.width - size)) | 0,
            y = (random() * (noise.height - size)) | 0;
        g.globalAlpha = 4 / size;
        g.drawImage(noise, x, y, size, size, 0, 0, canvas.width, canvas.height);
    }

    g.restore();
    return canvas;
}
