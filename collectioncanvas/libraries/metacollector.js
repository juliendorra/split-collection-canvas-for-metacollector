/////////////////// USER INPUT MANAGEMENT ////////////////////////////////////////////////////

//let userInputcollectorAddress = "tz1VhN58tCJbboQQoyTgLWoCwDUXBidfcAgd"; // juliendorra's address

let SANDBOX = false

const sandboxTokens = [
    "collectioncanvas/sandbox/tokens/0000.json",
    "collectioncanvas/sandbox/tokens/0001.json",
    "collectioncanvas/sandbox/tokens/0002.json",
    "collectioncanvas/sandbox/tokens/0003.json",
    "collectioncanvas/sandbox/tokens/0004.json",
    "collectioncanvas/sandbox/tokens/0005.json",
    "collectioncanvas/sandbox/tokens/0006.json",
    "collectioncanvas/sandbox/tokens/0007.json",
    "collectioncanvas/sandbox/tokens/0008.json",
    "collectioncanvas/sandbox/tokens/0009.json",
]

let mc = {
    walletAddress: "",
    seed: "",
    iteration: 1,
    canvas: {
        visualWidth: 0,
        visualHeight: 0
    },
    artfragments: []
}

let url = new URL(location.href);
let collectorAddressParam = url.searchParams.get("collectoraddress");

mc.iteration = parseInt(location.hash.substring(1))

let collectionCanvas

let canvasWidth
let canvasHeight

let imageLoadingCountdown

if (collectorAddressParam) {
    mc.walletAddress = collectorAddressParam;
}
if (!mc.walletAddress) {
    mc.walletAddress = ""
}

if (!Number.isInteger(mc.iteration)) {
    mc.iteration = 1
    onIterationUpdated(mc.iteration)
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}


function init() {

    document.getElementById('collectoraddress').value = mc.walletAddress;

    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onWindowResized);

    document.getElementById('drawcollectionbutton').addEventListener('click', onUserEnteredCollectorAddress)

    const canvasObserver = new MutationObserver(onCanvasReady)

    const canvasObserverConfig = { childList: true, attributes: false, subtree: false, characterData: false }

    const targetNode = document.getElementsByTagName('body')[0]

    canvasObserver.observe(targetNode, canvasObserverConfig)

    document.documentElement.style.setProperty('--random-hue-angle', Math.random() * 360);
}

function onCanvasReady(mutationList, observer) {

    collectionCanvas = document.getElementsByTagName('canvas')[0];

    if (collectionCanvas) {

        collectionCanvas.addEventListener('click', iterateMetacollector)

        document.getElementById("canvascontainer").appendChild(collectionCanvas)

        onWindowResized()

        if (mc.walletAddress) {
            fetchCollectorData(mc.walletAddress)
        }
        else {
            noTokensToShow()
        }

        observer.disconnect()
    }
}

function noTokensToShow() {

    if (mc.artfragments.length > 0) { return }

    // manage no tokens found
    document.getElementById('nofragment').style.display = "block"

    let ctx = collectionCanvas.getContext('2d')
    ctx.resetTransform()
    ctx.font = `${(canvasWidth / 13)}px sans-serif`
    ctx.fillStyle = "white"
    ctx.textAlign = "center"
    ctx.fillText("no art fragments collected", canvasWidth / 2, canvasHeight / 2)
}

function onKeyDown(event) {

    if (document.activeElement == document.getElementById('collectoraddress')) {

        if (event.key == "Enter") {
            onUserEnteredCollectorAddress();
        }
    }
    else {
        const sandboxIndex = parseInt(event.key)
        if (SANDBOX && (sandboxIndex >= 0 || sandboxIndex <= 9)) {
            console.log(sandboxIndex, sandboxTokens[sandboxIndex])
            renderSandboxCanvas(sandboxTokens[sandboxIndex])
        }
        else if (event.key == "u" || event.code == "U") {
            iterateMetacollector()
        }
    }

}

function onUserEnteredCollectorAddress() {

    mc.walletAddress = document.getElementById('collectoraddress').value;

    url.searchParams.set("collectoraddress", mc.walletAddress);

    window.history.replaceState({}, '', url.toString());

    fetchCollectorData(mc.walletAddress)
}

function renderSandboxCanvas(url) {

    console.log("sandbox: ", SANDBOX)

    fetch(url)
        .then((response) => response.json())
        .then((tokenArray) => {
            console.log(tokenArray)
            parseTokens(tokenArray)
        })
}

function iterateMetacollector(event) {
    mc.iteration++
    console.log(mc.iteration)
    paintCollectionUsingClone(mc)
    noTokensToShow()
    onIterationUpdated(mc.iteration)
}

function onIterationUpdated(iteration) {

    iteration = !iteration ? "" : iteration
    url.hash = iteration
    window.history.replaceState({}, '', url.toString());
    mc.iteration = parseInt(location.hash.substring(1))
}

function fetchCollectorData(userInputCollectorAddress) {

    let nftQuery = fetchTokens(userInputCollectorAddress)

    nftQuery
        .then(
            (tokens) => {
                parseTokens(tokens)
                stat(tokens, userInputCollectorAddress)
            }
        )

    // https://github.com/whatwg/fetch/issues/113#issuecomment-409922366

    fetchProfile(userInputCollectorAddress)
        .then((response) => {
            if (response.ok && response.status != 204) return response.json()
            else return ''
        })
        .catch((error) => {
            console.log(error)
        })
        .then(showProfile)

}

function showProfile(data) {

    // console.log(data)

}

function onWindowResized() {

    let pixelDensity = 1

    if ('devicePixelRatio' in window) {
        if (window.devicePixelRatio > 1) {
            pixelDensity = window.devicePixelRatio;
        }
    }

    canvasWidth = Math.min(window.innerWidth * 1, window.innerHeight * 0.7) * pixelDensity
    canvasHeight = canvasWidth

    if (collectionCanvas) {

        collectionCanvas.width = canvasWidth
        collectionCanvas.height = canvasHeight
        collectionCanvas.style.width = canvasWidth / pixelDensity + "px"
        collectionCanvas.style.height = canvasHeight / pixelDensity + "px"
        mc.canvas.visualWidth = canvasWidth / pixelDensity
        mc.canvas.visualHeight = canvasWidth / pixelDensity
        collectionCanvas.style.height = canvasHeight / pixelDensity + "px"
        mc.canvas.pixelWidth = canvasWidth
        mc.canvas.pixelHeight = canvasWidth
        paintCollectionUsingClone(mc)
    }
}

////////////////////////// STAT /////////////////////////////////////////////////////

const statsUrl = "https://script.google.com/macros/s/AKfycbxPRDRkkGsRD7uS6CwcaGMFWPtcpvp2KMvpNtX8XgV-dcqS-RqzWkuJiA0PBeMsMlchag/exec"


function stat(tokens, wallet) {

    console.log(tokens, wallet)
    let stat = { sandbox: SANDBOX, wallet: wallet, tokens: tokens.length, forwards: "" };

    const endpoint =
        statsUrl
        + "?stat="
        + encodeURIComponent(JSON.stringify(stat))

    fetch(endpoint)
        .then(
            (response) => {
                console.log(response.json())
            }
        )
}

/////////////////// COLLECTOR GALLERY DATA FETCHING ////////////////////////////////////////////////////

const ojktcomIndexerEndpoint = "https://data.objkt.com/v2/graphql";

const tztkProfileEndpointStart = "https://api.tzkt.io/v1/accounts/"
const tztkProfileEndpointEnd = "/metadata"
// schema
// {
//   "kind": "person",
//   "alias": "",
//   "description": "",
//   "site": "https://",
//   "email": "",
//   "twitter": "handle",
//   "instagram": "handle"
// }

const tezosProfileEndpoint = "https://api.tzprofiles.com/"

// the creator id is the minter of the tokens, and used to filter the tokens we want.
// tz1hJYLKMNffDWWamoXNNVSPXwAuNvVY9oii 
// is the address of the metacollector collection for thes alpha test

const query = `
query collectorGallery($address: String = "tz1VhN58tCJbboQQoyTgLWoCwDUXBidfcAgd", $fa2_id: String = "KT1QhxzQthAGa7Vcwj3WmegEorfAmR6F3hyq") {
  token_holder(where: {holder: {address: {_eq: $address}}, quantity: {_gt: "0"}, token: {fa_contract: {_eq: $fa2_id}}}) {
    quantity
    token {
      token_id
      metadata
      name
      supply
      artifact_uri
      attributes {
        attribute {
          name
          value
          type
        }
      }
    }
  }
}
`;

async function fetchGraphQL(operationsDoc, operationName, variables) {

    const result = await fetch(
        ojktcomIndexerEndpoint,
        {
            method: "POST",
            body: JSON.stringify({
                query: operationsDoc,
                variables: variables,
                operationName: operationName
            })
        }
    )
        .catch((error) => {
            console.log(error)
        });

    return await result.json();
}

async function fetchTokens(collectorAddress) {

    const { errors, data } = await fetchGraphQL(
        query,
        "collectorGallery",
        { "address": collectorAddress, "fa2_id": "KT1QhxzQthAGa7Vcwj3WmegEorfAmR6F3hyq" });
    if (errors) {
        console.error(errors);
    }

    const result = data.token_holder

    console.log(result)
    return result
}


async function fetchProfile(collectorAddress) {

    const tztkProfileEndpointFull = tztkProfileEndpointStart + collectorAddress + tztkProfileEndpointEnd

    return fetch(tztkProfileEndpointFull)

}

/////////////////// TOKEN AND METACOLLECTOR OBJECT PREPARATION  //////////////////////

// metacollector = {
//     walletAddress, // first 3 characters tz1 are always identical
//     iteration,
//     artfragments: [
//        {
//        image, // pi5js image object
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


function parseTokens(tokens) {

    const ipfsGateway = "https://cloudflare-ipfs.com/ipfs/"
    const ipfsGatewayAlt = "https://ipfs.fleek.co/ipfs/" // to use as a fallback


    mc.artfragments = []; // clearing the local data

    console.log(tokens)

    if (tokens.length < 1) {
        paintCollectionUsingClone(mc)
        noTokensToShow()
        return
    }

    document.getElementById('nofragment').style.display = "none"
    imageLoadingCountdown = tokens.length

    loadingMessage(imageLoadingCountdown, tokens[0].token.name)

    for (const thisToken of tokens) {

        const imageURL = thisToken.token.artifact_uri.replace("ipfs://", ipfsGateway) // using a public gateway. Later we could pin on our own gateway local to the web server to load them faster

        function parseAttributes(attributelist) {

            let flattenedObject = {}

            flattenedObject.colors = []

            for (let obj of attributelist) {

                // console.log(obj.attribute)

                if (obj.attribute.name == "color") {

                    flattenedObject.colors.push(obj.attribute.value)
                }
                else if (obj.attribute.type == "number" || obj.attribute.type == "angle") {

                    flattenedObject[obj.attribute.name] = parseFloat(obj.attribute.value)
                }
                else {

                    flattenedObject[obj.attribute.name] = obj.attribute.value
                }
            }

            return flattenedObject
        }

        // console.log(thisToken.token.attributes)

        let parsedAttributes = parseAttributes(thisToken.token.attributes)

        // console.log(parsedAttributes)

        fetch(imageURL).then(
            (response) => {
                return response.blob();
            })
            .then(
                (blob) => {
                    return createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' })
                })
            .then(
                (bitmap) => {

                    loadingMessage(imageLoadingCountdown, thisToken.token.name)

                    pushImage(bitmap, thisToken, parsedAttributes)

                    imageLoadingCountdown--

                    if (imageLoadingCountdown == 0) {
                        console.log("finished loading images")
                        let ctx = collectionCanvas.getContext('2d')
                        ctx.resetTransform()
                        ctx.clearRect(0, 0, collectionCanvas.width, collectionCanvas.height)
                        paintCollectionUsingClone(mc)
                    }
                }
            )
    }

}

function paintCollectionUsingClone(metacollector) {

    let clonedMetacollector;

    if (window.structuredClone) {

        clonedMetacollector = structuredClone(metacollector)
    }
    else {

        clonedMetacollector = JSON.parse(JSON.stringify(metacollector))
    }

    clonedMetacollector.seed = xmur3(metacollector.walletAddress)()

    clonedMetacollector.random = new aleaPRNG(metacollector.walletAddress)
    clonedMetacollector.randomIteration = new aleaPRNG(metacollector.iteration)

    paintCollection(clonedMetacollector)
}

function loadingMessage(countdown, nextName) {

    let ctx = collectionCanvas.getContext('2d')
    ctx.resetTransform()
    ctx.clearRect(0, 0, collectionCanvas.width, collectionCanvas.height)

    paintCollectionUsingClone(mc)

    ctx.resetTransform()
    ctx.font = `${(collectionCanvas.width / 20)}px sans-serif`
    ctx.fillStyle = "white"
    ctx.textAlign = "center"
    ctx.fillText(`loading ${countdown} images of fragments`, collectionCanvas.width / 2, collectionCanvas.height / 2 - collectionCanvas.height / 10)
    ctx.fillText(`next: ${nextName}`, collectionCanvas.width / 2, collectionCanvas.height / 2 + collectionCanvas.height / 10)

}


function pushImage(bitmap, thisToken, parsedAttributes) {

    let { ...attributes } = parsedAttributes // cloning the attributes

    attributes.widthToHeightRatio = bitmap.height / bitmap.width   // multiple to get height from width

    // set longest side of the image to size normalized value
    // precompute the other side using the real image ratio
    // longest side will always max to 1
    if (bitmap.width > bitmap.height) {
        attributes.width = attributes.size
        attributes.height = attributes.size * attributes.widthToHeightRatio
    }
    else {
        attributes.height = attributes.size
        attributes.width = attributes.size / attributes.widthToHeightRatio
    }

    attributes.displayWidth = collectionCanvas.width * attributes.width;
    attributes.displayHeight = collectionCanvas.width * attributes.height;

    for (let i = 1; i <= thisToken.quantity; i++) {

        let fragment = {
            name: thisToken.token.name,
            imageBitmap: bitmap,
            attributes: attributes
        }

        if (self.p5) {
            fragment.imageP5 = createP5Image(bitmap)
        }

        mc.artfragments.push(fragment)
    }
}

function createP5Image(bitmap) {

    const pImg = new p5.Image(1, 1, this);

    pImg.width = pImg.canvas.width = bitmap.width;
    pImg.height = pImg.canvas.height = bitmap.height;

    // Draw the image into the backing canvas of the p5.Image
    pImg.drawingContext.drawImage(bitmap, 0, 0);
    pImg.modified = true;

    return pImg;
}

/*
* Polyfill for createImageBitmap
* https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap
*
* Supports CanvasImageSource (img, video, canvas) sources, Blobs, and ImageData.
* 
* Source: https://gist.github.com/pseudosavant/a6d970b945ae85ef4dbc43200da94faf
*
* From:
* - https://dev.to/nektro/createimagebitmap-polyfill-for-safari-and-edge-228
* - https://gist.github.com/MonsieurV/fb640c29084c171b4444184858a91bc7
* Updated by:
* - Yoan Tournade <yoan@ytotech.com>
* - diachedelic, https://gist.github.com/diachedelic
* - Paul Ellis, https://pseudosavant.com
*/

(function createImageBitmapIIFE(global) {
    function isCanvasImageSource(el) {
        const validElements = ['img', 'video', 'canvas'];

        return (el && el.tagName && validElements.includes(el.tagName.toLowerCase()));
    }

    function idealSize(currentValue, newValue, numerator, denominator) {
        if (typeof newValue === 'number') return newValue;
        if (typeof numerator !== 'number' || typeof denominator !== 'number') return currentValue;

        return (numerator / denominator) * currentValue;
    }

    if (!('createImageBitmap' in global)) {
        global.createImageBitmap = async function polyfillCreateImageBitmap(data, opts) {
            return new Promise((resolve, reject) => {
                opts = opts || {};

                let dataURL;
                const canvas = document.createElement('canvas');

                try {
                    const ctx = canvas.getContext('2d');

                    if (data instanceof Blob) {
                        dataURL = URL.createObjectURL(data);
                    } else if (isCanvasImageSource(data)) {
                        const width = data.naturalWidth || data.videoWidth || data.clientWidth || data.width
                        const height = data.naturalHeight || data.videoHeight || data.clientHeight || data.height
                        canvas.width = idealSize(width, opts.resizeWidth, opts.resizeHeight, height);
                        canvas.height = idealSize(height, opts.resizeHeight, opts.resizeWidth, width);

                        ctx.drawImage(data, 0, 0, canvas.width, canvas.height);

                        dataURL = canvas.toDataURL();
                    } else if (data instanceof ImageData) {
                        canvas.width = idealSize(data.width, opts.resizeWidth, opts.resizeHeight, data.height);;
                        canvas.height = idealSize(data.height, opts.resizeHeight, opts.resizeWidth, data.width);

                        ctx.putImageData(data, 0, 0);

                        dataURL = canvas.toDataURL();
                    } else {
                        reject('createImageBitmap does not handle the provided image source type');
                    }

                    const img = new Image();
                    img.onerror = reject;
                    img.onload = () => resolve(img);
                    img.src = dataURL;
                } finally {
                    // avoid memory leaks on iOS Safari, see https://stackoverflow.com/a/52586606
                    canvas.width = 0;
                    canvas.height = 0;
                }
            });
        };
    }

})(self);

// MurmurHash3

function xmur3(str) {
    for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = h << 13 | h >>> 19;
    } return function () {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

// Alea
// original article https://web.archive.org/web/20110608011113/http://baagoe.com/en/RandomMusings/javascript/
// mirror https://github.com/nquinlan/better-random-numbers-for-javascript-mirror
// alt implementation: https://github.com/davidbau/seedrandom/blob/released/lib/alea.js
// alt implementation https://github.com/coverslide/node-alea/blob/master/alea.js
// this implementation https://github.com/macmcmeans/aleaPRNG/blob/master/aleaPRNG-1.1.js

function aleaPRNG() {
    return (function (args) {
        "use strict";

        const version = 'aleaPRNG 1.1.0';

        var s0
            , s1
            , s2
            , c
            , uinta = new Uint32Array(3)
            , initialArgs
            , mashver = ''
            ;

        /* private: initializes generator with specified seed */
        function _initState(_internalSeed) {
            var mash = Mash();

            // internal state of generator
            s0 = mash(' ');
            s1 = mash(' ');
            s2 = mash(' ');

            c = 1;

            for (var i = 0; i < _internalSeed.length; i++) {
                s0 -= mash(_internalSeed[i]);
                if (s0 < 0) { s0 += 1; }

                s1 -= mash(_internalSeed[i]);
                if (s1 < 0) { s1 += 1; }

                s2 -= mash(_internalSeed[i]);
                if (s2 < 0) { s2 += 1; }
            }

            mashver = mash.version;

            mash = null;
        };

        /* private: dependent string hash function */
        function Mash() {
            var n = 4022871197; // 0xefc8249d

            var mash = function (data) {
                data = data.toString();

                // cache the length
                for (var i = 0, l = data.length; i < l; i++) {
                    n += data.charCodeAt(i);

                    var h = 0.02519603282416938 * n;

                    n = h >>> 0;
                    h -= n;
                    h *= n;
                    n = h >>> 0;
                    h -= n;
                    n += h * 4294967296; // 0x100000000      2^32
                }
                return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
            };

            mash.version = 'Mash 0.9';
            return mash;
        };


        /* private: check if number is integer */
        function _isInteger(_int) {
            return parseInt(_int, 10) === _int;
        };

        /* public: return a 32-bit fraction in the range [0, 1]
        This is the main function returned when aleaPRNG is instantiated
        */
        var random = function () {
            var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32

            s0 = s1;
            s1 = s2;

            return s2 = t - (c = t | 0);
        };

        /* public: return a 53-bit fraction in the range [0, 1] */
        random.fract53 = function () {
            return random() + (random() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
        };

        /* public: return an unsigned integer in the range [0, 2^32] */
        random.int32 = function () {
            return random() * 0x100000000; // 2^32
        };

        /* public: advance the generator the specified amount of cycles */
        random.cycle = function (_run) {
            _run = typeof _run === 'undefined' ? 1 : +_run;
            if (_run < 1) { _run = 1; }
            for (var i = 0; i < _run; i++) { random(); }
        };

        /* public: return inclusive range */
        random.range = function () {
            var loBound
                , hiBound
                ;

            if (arguments.length === 1) {
                loBound = 0;
                hiBound = arguments[0];

            } else {
                loBound = arguments[0];
                hiBound = arguments[1];
            }

            if (arguments[0] > arguments[1]) {
                loBound = arguments[1];
                hiBound = arguments[0];
            }

            // return integer
            if (_isInteger(loBound) && _isInteger(hiBound)) {
                return Math.floor(random() * (hiBound - loBound + 1)) + loBound;

                // return float
            } else {
                return random() * (hiBound - loBound) + loBound;
            }
        };

        /* public: initialize generator with the seed values used upon instantiation */
        random.restart = function () {
            _initState(initialArgs);
        };

        /* public: seeding function */
        random.seed = function () {
            _initState(Array.prototype.slice.call(arguments));
        };

        /* public: show the version of the RNG */
        random.version = function () {
            return version;
        };

        /* public: show the version of the RNG and the Mash string hasher */
        random.versions = function () {
            return version + ', ' + mashver;
        };

        // when no seed is specified, create a random one from Windows Crypto (Monte Carlo application) 
        if (args.length === 0) {
            window.crypto.getRandomValues(uinta);
            args = [uinta[0], uinta[1], uinta[2]];
        };

        // store the seed used when the RNG was instantiated, if any
        initialArgs = args;

        // initialize the RNG
        _initState(args);

        return random;

    })(Array.prototype.slice.call(arguments));
};