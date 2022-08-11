
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
//     iteration,
//     canvas: {
//          visualWidth,  // the visual size of the canvas, as set by metacollector
//          visualHeight,
//          metacollector.canvas.pixelWidth = canvasWidth,  // the pixel size of the canvas
//          metacollector.canvas.pixelHeight = canvasWidth
//       },
//     artfragments: [
//        {
//        imageP5, // p5.js image object, exists only if p5.js is detected in global context
//        imageBitmap, // imageBitmap, native JavaScript interface to store and draw images on canvas. Polyfilled on Safari <= 14
//        name, // public name of the fragment, several fragments can have the same
//        attributes: {
//                family,
//                size, // normalized [0, 1]
//                width, // calculated from image for convenience
//                height, // calculated from image for convenience
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

        const fragmentPixelWidth = fragment.attributes.size * width * 3;
        const fragmentPixelHeight = fragment.attributes.size * width * widthToHeightRatio * 3;

        const centerX = fragmentPixelWidth / 2;
        const centerY = fragmentPixelHeight / 2;

        positionX -= sliceWidth;
        positionY = (height / 2) + (height / 2 * (fragment.attributes.energy - 0.5))

        console.log(positionX, positionY)

        ctx.save(); // save point before changing origin and rotating the canvas

        ctx.translate(positionX, positionY)

        // Create a clipping paths
        let circlesPath = new Path2D();
        circlesPath.ellipse(
            0,
            -width * 0.25,
            sliceWidth * 1.2,
            height * 0.6,
            0,
            0, 2 * Math.PI); // could use direction as it's an angle
        circlesPath.ellipse(
            width * 0.1,
            width * 0.25,
            sliceWidth * 1.4,
            height * 0.6,
            6.2,
            0, 2 * Math.PI); // could use direction as it's an angle


        // // Set the clip to the circles
        ctx.clip(circlesPath);

        ctx.translate(fragmentPixelWidth / 3, 0);

        ctx.rotate(fragment.attributes.direction);

        ctx.translate(-centerX, -centerY) // centering to center of image

        ctx.fillStyle = fragment.attributes.colors[2]
        ctx.rect(0, 0, fragmentPixelWidth, fragmentPixelHeight);
        ctx.fill()


        ctx.drawImage(fragment.imageBitmap,
            0, 0,
            fragmentPixelWidth,
            fragmentPixelHeight
        )

        ctx.restore(); // cancel all transformations

    }

}

function drawBackground(ctx) {

    ctx.fillStyle = "white"
    ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fill()

}
