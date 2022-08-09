let img;
let imgs;
let cs;
let cs2;
let imagePositions;

// if you use p5.js use the setup function to create your canvas
// Here it's set at 0, 0: the canvas size will be updated to fit once you create it, 
// You shouldn't use background() in the setup, as you have nothing to show yet! Use background when drawing

function setup() {
    createCanvas(0, 0); // canvas will resized by the metacollector code, you don't control its size
    noLoop();
}

// the onRequestPaintCollection() function is a hook that metacollector uses to call your sketch

// it will called everytime your sketch must be drawn, and it receive the metacollector object:

// metacollector = {
//     walletAddress, // first 3 characters tz1 are always identical
//     seed, // positive integer, pre-hashed from wallet address as a convenience. Use it as the seed of your random number generator
//     iteration,
//     canvas: {
//          visualWidth,  // the visual size of the canvas, as set by metacollector
//          visualHeight
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

// if you use p5.js you should not use the automagic draw() function to draw,
// instead use one or several functions that are explicitly called only when needed by paintCollection

function paintCollection(metacollector) {
    clear();

    randomSeed(metacollector.seed + metacollector.iteration);

    // Use the visual canvas size values passed in metacollector object for calculating your drawing positions, as it can change between drawings (ie. resizing)
    cs = metacollector.canvas.visualWidth;
    cs2 = cs * 0.5;

    // if you use p5.js, you need to use the resizeCanvas function to update the internal width and height values that p5.js use. (It doesn't use the real values directly)

    resizeCanvas(metacollector.canvas.visualWidth, metacollector.canvas.visualHeight, true); // true: noRedraw, don't redraw the canvas now

    // Do something to draw the fragments

    tokenList = metacollector.artfragments;

    tokenList.sort((a, b) => b.attributes.size - a.attributes.size);

    colorMode(HSB);
    noStroke();
    imageMode(CENTER);

    fill(0);
    rect(0, 0, cs, cs);
    drawStars();

    let r = (0.25 * random() + 0.1) * cs;
    let imageBoxes = getImageBoxes(r, tokenList.length);
    imageBoxes.forEach((b) => shiftBox(b));
    makeBoxBackgrounds(tokenList, imageBoxes, r);

    drawImages(tokenList, imageBoxes);

    granulate(20);
}

function drawStars() {
    push();
    stroke(100);
    for (let i = 0; i < 1000; i++) {
        strokeWeight(random() * cs * 0.001);
        point(random() * cs, random() * cs);
    }
    pop();
}

function fillBox(b) {
    beginShape();
    vertex(b.tl.x, b.tl.y);
    vertex(b.tr.x, b.tr.y);
    vertex(b.br.x, b.br.y);
    vertex(b.bl.x, b.bl.y);
    endShape(CLOSE);
}

function makeBoxBackgrounds(tokenList, imageBoxes, r) {
    push();

    if (random() < 0.5) blendMode(SCREEN);

    let selectedColors = [];
    tokenList.forEach((token) =>
        selectedColors.push(color(random(token.attributes.colors)))
    );
    let density = 100;
    let alphaLow = Math.round(random()) * 0.05;
    alphaLow = 0;
    let radiusRatio = r / cs2;

    for (let i = 0; i < density; i++) {
        for (let j = 0; j < tokenList.length; j++) {
            let b = imageBoxes[j];
            let col = selectedColors[j];
            let token = tokenList[j];
            let energy = token.attributes.energy;
            fill(
                color(
                    hue(col),
                    saturation(col),
                    brightness(col),
                    map(i, 0, density, map(energy, 0, 1, 0.05, 0.15), alphaLow)
                )
            );
            let spaceyCircleSize = b.w * 4;
            let definedCircleSize =
                b.w *
                (0.5 +
                    1.5 * radiusRatio +
                    1 * random() +
                    (15 - tokenList.length) * 0.15);

            let maxCircleSize =
                random() < 0.5 ? spaceyCircleSize : definedCircleSize;

            circle(b.c.x, b.c.y, map(i, 0, density, 0, maxCircleSize));
        }
    }
    pop();
}

function getImageBoxes(r, length) {
    let imageBoxes = [];
    let boxSize = (r / cs2) * cs * 0.4;
    let boxSize2 = boxSize * 0.5;
    length -= 1;
    let offset = random() * TWO_PI;
    for (let i = 0; i < length; i++) {
        let angle = (TWO_PI * i) / length + offset;
        imageBoxes.push(
            new Box(
                cs2 + cos(angle) * r - boxSize2,
                cs2 + sin(angle) * r - boxSize2,
                boxSize,
                boxSize
            )
        );
    }
    imageBoxes = [
        new Box(cs2 - boxSize2, cs2 - boxSize2, boxSize, boxSize),
    ].concat(imageBoxes);
    return shuffle(imageBoxes);
}

function drawImages(tokenList, imageBoxes) {
    let maxSize = random() * 0.8 + 0.7;
    for (let i = 0; i < tokenList.length; i++) {
        let b = imageBoxes[i];
        let token = tokenList[i];
        let f = map(token.attributes.size, 0, 1, 0.5, maxSize);

        let img = token.imageP5;

        let shiftAmt = 0.01;
        let shiftFn = () => map(random(), 0, 1, -shiftAmt * cs, shiftAmt * cs);

        let speed = token.attributes.speed;
        let energy = token.attributes.energy;
        let rotation = token.attributes.direction;
        drawingContext.globalAlpha = map(energy, 0, 1, 0.01, 0.3);

        let numImages = map(speed, 0, 1, 0, 35);

        // draw multiple, rotated and shifted low alpha versions of the fragement
        for (let j = 0; j < numImages; j++) {
            push();

            let rotateAmt = map(speed, 0, 1, 0.05, 0.8);
            shiftAmt = map(speed, 0, 1, 0.002, 0.03);

            let shiftX = shiftFn();
            let shiftY = shiftFn();

            translate(b.c.x, b.c.y);
            rotate(map(random(), 0, 1, -rotateAmt, rotateAmt));
            rotate(rotation);
            translate(-b.c.x, -b.c.y);

            translate(shiftX, shiftY);
            image(
                img,
                b.c.x,
                b.c.y,
                b.w * f,
                (b.h * f * img.height) / img.width
            );
            translate(-shiftX, -shiftY);
            pop();
        }
        push();

        // draw the actual fragment
        translate(b.c.x, b.c.y);
        rotate(rotation);
        translate(-b.c.x, -b.c.y);

        drawingContext.globalAlpha = 1;
        image(img, b.c.x, b.c.y, b.w * f, (b.h * f * img.height) / img.width);
        pop();
        drawingContext.globalAlpha = 1;
    }
}

function getRandomSubarray(arr, size) {
    var shuffled = arr.slice(0),
        i = arr.length,
        min = i - size,
        temp,
        index;
    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
}

let frequency = 0.008 * Math.random();
let amplitude = 0.05 * Math.random();
function shiftVertex(v) {
    v.y += sin(v.x * frequency) * cs * amplitude;
}

function shiftBox(box) {
    shiftVertex(box.c);
    shiftVertex(box.tl);
    shiftVertex(box.tr);
    shiftVertex(box.br);
    shiftVertex(box.bl);
    shiftVertex(box.tc);
    shiftVertex(box.rc);
    shiftVertex(box.bc);
    shiftVertex(box.lc);
}

function shiftGrid(grid) {
    grid.forEach((row) => row.forEach((b) => shiftBox(b)));
}

let Box = class {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.c = createVector(x + w * 0.5, y + h * 0.5);
        this.tl = createVector(x, y);
        this.tr = createVector(x + w, y);
        this.br = createVector(x + w, y + h);
        this.bl = createVector(x, y + h);
        this.tc = createVector(x + w * 0.5, y);
        this.rc = createVector(x + w, y + h * 0.5);
        this.bc = createVector(x + w * 0.5, y + h);
        this.lc = createVector(x, y + h * 0.5);
    }
    gridify(gridWidth, gridHeight) {
        let grid = [];
        let boxWidth = this.w / gridWidth;
        let boxHeight = this.h / gridHeight;

        for (let i = 0; i < gridHeight; i++) {
            grid.push([]);
            for (let j = 0; j < gridWidth; j++) {
                grid[i].push(
                    new Box(
                        this.x + boxWidth * j,
                        this.y + boxHeight * i,
                        boxWidth,
                        boxHeight
                    )
                );
            }
        }
        return grid;
    }
    randomPoint() {
        return createVector(
            this.x + random() * this.w,
            this.y + random() * this.h
        );
    }
};

function granulate(amt) {
    loadPixels();
    let pd = pixelDensity();
    let fn = (x) => x; //max(min(200, x), 50)
    for (let i = 0; i < cs * pd * cs * pd * 4; i += 4) {
        let n = random() * 2 * amt - amt;
        pixels[i] = fn(pixels[i] + n);
        pixels[i + 1] = fn(pixels[i + 1] + n);
        pixels[i + 2] = fn(pixels[i + 2] + n);
        //pixels[i + 3] = fn(pixels[i + 3] + n)
    }

    updatePixels();
}
