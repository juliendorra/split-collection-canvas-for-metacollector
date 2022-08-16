
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

    drawBackground(ctx);

    // sorting the fragments from bigger to smaller
    metacollector.artfragments.sort((a, b) => {
        return b.attributes.size - a.attributes.size; // descending order sort
    })

    const totalFragments = metacollector.artfragments.length;
    const sliceWidth = width / totalFragments

    let positionX = width;
    let positionY = height / 2;

    for (let fragment of metacollector.artfragments) {

        const widthToHeightRatio = fragment.attributes.width / fragment.attributes.height;

        const fragmentPixelWidth = Math.min(
            fragment.attributes.size * width * 3,
            width
        );

        const fragmentPixelHeight = Math.min(
            fragment.attributes.size * width * widthToHeightRatio * 3,
            width * widthToHeightRatio
        );

        const centerX = fragmentPixelWidth / 2;
        const centerY = fragmentPixelHeight / 2;

        positionX -= sliceWidth;
        positionY = (height / 2) - (height * (fragment.attributes.energy - 0.5))

        console.log(positionX, positionY, fragment.attributes.energy - 0.5)

        ctx.save(); // save point before changing origin and rotating the canvas

        ctx.translate(positionX, positionY)

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


        // Set the clip to the circles
        ctx.clip(circlesPath);

        ctx.translate(fragmentPixelWidth / 3, 0);
        ctx.rotate(fragment.attributes.direction);
        ctx.translate(-centerX, -centerY) // centering to center of image

        ctx.fillStyle = fragment.attributes.colors[2]
        ctx.fill()


        // make the background color more varied with some noise
        ctx.save();
        ctx.resetTransform()
        noisyCanvas = document.createElement("canvas");
        noisyCanvas.width = width / 4;
        noisyCanvas.height = height / 4;
        noisyCanvas = perlinNoise(noisyCanvas);
        //noisyCanvas = randomNoise(noisyCanvas);

        ctx.globalCompositeOperation = "luminosity"

        ctx.drawImage(noisyCanvas,
            0, 0,
            width,
            height
        )
        ctx.restore();
        ctx.globalCompositeOperation = "source-over"

        // draw fragment
        ctx.drawImage(fragment.imageBitmap,
            0, 0,
            fragmentPixelWidth,
            fragmentPixelHeight
        )

        ctx.restore(); // cancel all transformations for next fragment

    }

}

function drawBackground(ctx) {

    ctx.fillStyle = "white"
    ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fill()
}

// https://gist.github.com/donpark/1796361
/* Following canvas-based Perlin generation code originates from
 * iron_wallaby's code at: http://www.ozoneasylum.com/30982
 */
function randomNoise(canvas, x, y, width, height, alpha) {
    x = x || 0;
    y = y || 0;
    width = width || canvas.width;
    height = height || canvas.height;
    alpha = alpha || 60;
    var g = canvas.getContext("2d"),
        imageData = g.getImageData(x, y, width, height),
        random = Math.random, // REPLACE WITH DETERMINISTIC RANDOM LIKE ALEA.JS
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

function perlinNoise(canvas, noise) {
    noise = noise || randomNoise(canvas);
    var g = canvas.getContext("2d");
    g.save();

    /* Scale random iterations onto the canvas to generate Perlin noise. */
    for (var size = 4; size <= noise.width; size *= 2) {
        var x = (Math.random() * (noise.width - size)) | 0, // REPLACE WITH DETERMINISTIC RANDOM LIKE ALEA.JS
            y = (Math.random() * (noise.height - size)) | 0; // REPLACE WITH DETERMINISTIC RANDOM LIKE ALEA.JS
        g.globalAlpha = 4 / size;
        g.drawImage(noise, x, y, size, size, 0, 0, canvas.width, canvas.height);
    }

    g.restore();
    return canvas;
}
