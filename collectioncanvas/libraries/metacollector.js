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

let metacollector = {
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

metacollector.iteration = parseInt(location.hash.substring(1))

let collectionCanvas

let canvasWidth
let canvasHeight

let imageLoadingCountdown

if (collectorAddressParam) {
    metacollector.walletAddress = collectorAddressParam;
}
if (!metacollector.walletAddress) {
    metacollector.walletAddress = ""
}

metacollector.seed = xmur3(metacollector.walletAddress)()

if (!Number.isInteger(metacollector.iteration)) {
    metacollector.iteration = 1
    onIterationUpdated(metacollector.iteration)
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

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

function init() {

    document.getElementById('collectoraddress').value = metacollector.walletAddress;

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

        if (metacollector.walletAddress) {
            fetchCollectorData(metacollector.walletAddress)
        }
        else {
            noTokensToShow()
        }

        observer.disconnect()
    }
}

function noTokensToShow() {

    if (metacollector.artfragments.length > 0) { return }

    // manage no tokens found
    document.getElementById('nofragment').style.display = "block"

    var ctx = collectionCanvas.getContext('2d');
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

    metacollector.walletAddress = document.getElementById('collectoraddress').value;

    metacollector.seed = xmur3(metacollector.walletAddress)()

    url.searchParams.set("collectoraddress", metacollector.walletAddress);

    window.history.replaceState({}, '', url.toString());

    fetchCollectorData(metacollector.walletAddress)
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
    metacollector.iteration++
    console.log(metacollector.iteration)
    paintCollection(metacollector)
    noTokensToShow()
    onIterationUpdated(metacollector.iteration)
}

function onIterationUpdated(iteration) {

    iteration = !iteration ? "" : iteration
    url.hash = iteration
    window.history.replaceState({}, '', url.toString());
    metacollector.iteration = parseInt(location.hash.substring(1))
}

function fetchCollectorData(userInputCollectorAddress) {

    nftQuery = fetchTokens(userInputCollectorAddress)

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
        metacollector.canvas.visualWidth = canvasWidth / pixelDensity
        metacollector.canvas.visualHeight = canvasWidth / pixelDensity
        paintCollection(metacollector)
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


    metacollector.artfragments = []; // clearing the local data

    console.log(tokens)

    if (tokens.length < 1) {
        paintCollection(metacollector)
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

            for (obj of attributelist) {

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
                        paintCollection(metacollector)
                    }
                }
            )
    }

}

function loadingMessage(countdown, nextName) {

    let ctx = collectionCanvas.getContext('2d')
    ctx.resetTransform()
    ctx.clearRect(0, 0, collectionCanvas.width, collectionCanvas.height)

    paintCollection(metacollector)

    ctx.resetTransform()
    ctx.font = `${(collectionCanvas.width / 20)}px sans-serif`
    ctx.fillStyle = "white"
    ctx.textAlign = "center"
    ctx.fillText(`loading ${countdown} images of fragments`, collectionCanvas.width / 2, collectionCanvas.height / 2 - collectionCanvas.height / 10)
    ctx.fillText(`next: ${nextName}`, collectionCanvas.width / 2, collectionCanvas.height / 2 + collectionCanvas.height / 10)

}


function pushImage(bitmap, thisToken, parsedAttributes) {

    let { ...attributes } = parsedAttributes // cloning the attributes

    let widthToHeightRatio = bitmap.width / bitmap.height // ie. 16/9, 4/3

    // set longest side of the image to size normalized value
    // precompute the other side using the real image ratio
    // longest side will always max to 1
    if (bitmap.width > bitmap.height) {
        attributes.width = attributes.size
        attributes.height = attributes.size * widthToHeightRatio
    }
    else {
        attributes.height = attributes.size
        attributes.width = attributes.size / widthToHeightRatio
    }

    for (let i = 1; i <= thisToken.quantity; i++) {

        let fragment = {
            name: thisToken.token.name,
            imageBitmap: bitmap,
            attributes: attributes
        }

        if (p5) {
            fragment.imageP5 = createP5Image(bitmap)
        }

        metacollector.artfragments.push(fragment)
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

})(this);