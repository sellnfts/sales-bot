const GIFEncoder = require('gif-encoder-2');
const Jimp = require('jimp');
const { createCanvas, Image, registerFont, ImageData } = require('canvas')
// registerFont('./font/Roobert-Regular.ttf', { family: 'Sans Serif' })
const fs = require('fs');
const { createWriteStream } = require('fs')
const path = require('path')
const WIDTH = 1080;
const HEIGHT = 1080;
const FRAMES = 20;
const DELAY = 1500;
const newDELAY = 2000;
const canvas = createCanvas(WIDTH, HEIGHT, 'neuquant')
const ctx = canvas.getContext('2d')


// const opensea = fs.readFileSync(__dirname + '/temp/input/opensea.png');
// const mekaLogo = fs.readFileSync(__dirname + '/temp/input/meka__logo.png');
// var imgOpensea = new Image();
// imgOpensea.src = opensea; 
// var imgMekaLogo = new Image();
// imgMekaLogo.src = mekaLogo; 

require('dotenv').config();

const randomstring = require("randomstring");

const axios = require('axios');

// Twitter v1 
const twit = require('twit');
const twitterConfig = {
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
};
const twitterClient = new twit(twitterConfig);


// Twitter v2 
const { TwitterApi } = require('twitter-api-v2');
const client = new TwitterApi({
    appKey: process.env.CONSUMER_KEY,
    appSecret: process.env.CONSUMER_SECRET,
    accessToken: process.env.ACCESS_TOKEN_KEY,
    accessSecret: process.env.ACCESS_TOKEN_SECRET,
  });
const bearer  = new TwitterApi(process.env.BEARER);
const twitterClientV2 = client.readWrite;
const twitterBearerV2 = bearer.readOnly;


// Tweet a text-based status
async function tweet(tweetText) {
    // const tweet = {
    //     status: tweetText,
    // };

    // twitterClient.post('statuses/update', tweet, (error, tweet, response) => {
    //     if (!error) {
    //         console.log(`Successfully tweeted: ${tweetText}`);
    //     } else {
    //         console.error(error);
    //     }
    // });
    console.log(tweetText);
    try{
         await twitterClientV2.v2.tweet({ text: tweetText })
    }catch(e){
        console.log("Error in tweet");
        console.log(e);
    }
}


function wait5sec (waitTime) {

    return new Promise ((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, waitTime);
    });
    
  }

async function tweetWithImage(tweetText, imageUrl) {
    // Format our image to base64
    const processedImage = await getBase64(imageUrl);
    //console.log(`Successfully tweeted: ${tweetText}`);
    // Upload the item's image from OpenSea to Twitter & retrieve a reference to it
    console.log(tweetText)
    // twitterClient.post('media/upload', { media_data: processedImage }, (error, media, response) => {
    //     if (!error) {
    //         const tweet = {
    //             status: tweetText,
    //             media_ids: [media.media_id_string]
    //         };
    //         console.log(media_ids)
    //         // twitterClient.post('statuses/update', tweet, (error, tweet, response) => {
    //         //     if (!error) {
    //         //         console.log(`Successfully tweeted: ${tweetText}`);
    //         //     } else {
    //         //         console.error(error);
    //         //     }
    //         // });
    //     } else {
    //         console.error(error);
    //     }
    // });
    
    try {
        const mediaId = await twitterClientV2.v1.uploadMedia(processedImage,{ mimeType: 'png'});
        console.log(mediaId);
         await twitterClientV2.v2.tweet({ text: tweetText, media: { media_ids: [mediaId] } })
        //fs.unlinkSync(dstPath)
    } catch (e) {
        console.log("Upload png failed");
        console.log(e);
        //tweet(tweetText);
    }
}


// async function tweetSweep(tweetText, mediaID) {
//     const sweepTweet = {
//         status: tweetText,
//         media_ids: mediaID
//     };
//     console.log("TYpe of media ID is - ");
//     console.log(typeof mediaID);
//     //console.log("media ids are" + mediaID);
//     console.log(sweepTweet)
//     // twitterClient.post('statuses/update', sweepTweet, (error, tweet, response) => {
//     //     if (!error) {
//     //         console.log(`Successfully tweeted: ${tweetText}`);
//     //     }else {
//     //         console.error(error);
//     //     }
//     // })
//     try {
//         //const mediaId = await twitterClientV2.v1.uploadMedia(dstPath);
//         //console.log(mediaId);
//         //await twitterClientV2.v2.tweet({ text: tweetText, media: { media_ids: [mediaId] } })
//         //fs.unlinkSync(dstPath)
//     } catch (e) {
//         console.log("error tweeting sweep");
//         //tweet(tweetText);
//     }
// }

function getBase64(url) {
    //return axios.get(url, { responseType: 'arraybuffer'}).then(response => Buffer.from(response.data, 'binary').toString('base64'))

    return axios.get(url, { responseType: 'arraybuffer'}).then(response => {
        //console.log(response.status);
        if(response.status == 200){
            isProcessed = true;
            console.log("isProcessed - " + isProcessed)
            //return Buffer.from(response.data, 'binary').toString('base64')
            return response.data
            }
            else{
                throw "not 200"
            }
        }).catch(error =>{
            //isProcessed = false
            //console.log("isProcessed - " + isProcessed)
            console.log("error in base64");
            //fallback(tokenID);
            return null
        })
}


async function getGif(mediaURL) {
    if(mediaURL.length == 0) return 'false'
    console.log(mediaURL[0].imageUrl)
    console.log(mediaURL[0].caption1)
    const blackFont40 = await Jimp.loadFont(path.join(__dirname, '/font/EfArVYBtsXNa6i2EQsOIJHht.ttf.fnt'));
    const blackFont50 = await Jimp.loadFont(path.join(__dirname, '/font/fqnxpNBsErSD0THpF7FPSAPp.ttf.fnt'));
    const whiteFont50 = await Jimp.loadFont(path.join(__dirname, '/font/F_1eUhVJ51uKHbd6iOco_Gai.ttf.fnt'));
    const blurFont = await Jimp.loadFont(path.join(__dirname, '/font/U0vyI1eXZMI0ZL4WY96LEOeF.ttf.fnt'));
    const openseaFont = await Jimp.loadFont(path.join(__dirname, '/font/KUDWHuDzzwzpR1atYq7EB9zz.ttf.fnt'));
    const looksrareFont = await Jimp.loadFont(path.join(__dirname, '/font/FjTCedcyNBE4NgUt2iUppDXR.ttf.fnt'));
    const x2y2Font = await Jimp.loadFont(path.join(__dirname, '/font/l1xPJ6gsUbU7j3y_9hsv_sP0.ttf.fnt'));
    const firstframe = await Jimp.read(__dirname + `/temp/input/firstframe.jpg`)
    //const firstframe = await Jimp.read(__dirname + `/temp/input/firstframe.jpg`);
    //const mekaLOGO = await Jimp.read(__dirname + `/temp/input/meka__logo.png`);

    //let caption = mediaURL[0].caption
    const dstPath = path.join(__dirname, '/temp/output', `${randomstring.generate({length: 12,charset: 'alphabetic'})}.gif`)
    //console.log("dspath is before file creation is - " + dstPath)
    //const dstPath = path.join(__dirname, '/temp/output', `42423.gif`)
    const writeStream = createWriteStream(dstPath)
    const encoder = new GIFEncoder(WIDTH, HEIGHT);
    encoder.createReadStream().pipe(writeStream)
    encoder.start()
    encoder.setRepeat(0);
    encoder.setDelay(DELAY);
    encoder.setQuality(30);
    //console.log("create stream")
    // ctx.font = '50px Roobert-Regular'
    // ctx.fillStyle = "#f2f2f2";
    // ctx.fillRect(0, 0, 1080, 1080);
    // ctx.strokeStyle = "red";
    // ctx.moveTo(540, 20);
    // ctx.lineTo(540, 1000);
    // ctx.stroke();
    // ctx.fillStyle = "#3b3a48";
    // ctx.textAlign = "center";
    // backgroundIMG.composite(mekaLOGO,1080 / 2 - 100 / 2 ,1080 / 1.15 - 100 / 2, {
    //     mode: Jimp.BLEND_SOURCE_OVER
    // });
    //await backgroundIMG.writeAsync(`temp/input/firstframe.jpg`);
    firstframe.print(blackFont50, 0, -140, {
        text: mediaURL[0].caption1,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
	    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
    }, 1080, 1080);
    firstframe.print(blackFont50, 0, -60, {
        text: mediaURL[0].caption2,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
	    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
    }, 1080, 1080);


    if (mediaURL[0].marketName == 'Opensea') {
        firstframe.print(blackFont50, -115, 20, {
            text: mediaURL[0].caption3,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
        }, 1080, 1080);
        firstframe.print(openseaFont, 35, 20, {
            text: 'Opensea',
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
        }, 1080, 1080);
        ctx.fillText('Opensea', 470, 610)
      } else if (mediaURL[0].marketName == 'X2Y2') {
        firstframe.print(blackFont50, -75, 20, {
            text: mediaURL[0].caption3,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
        }, 1080, 1080);
        firstframe.print(x2y2Font, 35, 20, {
            text: 'X2Y2',
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
        }, 1080, 1080);
      } else if (mediaURL[0].marketName == 'LooksRare'){
        firstframe.print(blackFont50, -135, 20, {
            text: mediaURL[0].caption3,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
        }, 1080, 1080);
        firstframe.print(looksrareFont, 35, 20, {
            text: 'LooksRare',
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
        }, 1080, 1080);
      } else if (mediaURL[0].marketName == 'blur'){
        firstframe.print(blackFont50, -55, 20, {
            text: mediaURL[0].caption3,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
        }, 1080, 1080);
        firstframe.print(blurFont, 35, 20, {
            text: 'Blur',
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
        }, 1080, 1080);
      }
    
    //ctx.drawImage(imgMekaLogo, 540, 200); 
    //ctx.drawImage(imgMekaLogo,1080 / 2 - imgMekaLogo.width / 2 ,1080 / 1.15 - imgMekaLogo.height / 2);    
    //ctx.fillText(mediaURL[0].caption1, 540, 470)
    //ctx.fillText(mediaURL[0].caption2, 540, 540)
    // if (mediaURL[0].marketName == 'Opensea') {
    //     ctx.textAlign = "right";
    //     ctx.fillText(mediaURL[0].caption3, 460, 610)
    //     ctx.fillStyle = "#1f7edc";
    //     ctx.textAlign = "left";
    //     ctx.fillText('Opensea', 470, 610)
    //   } else if (mediaURL[0].marketName == 'X2Y2') {
    //     ctx.textAlign = "right";
    //     ctx.fillText(mediaURL[0].caption3, 500, 610)
    //     ctx.fillStyle = "#503acb";
    //     ctx.textAlign = "left";
    //     ctx.fillText('X2Y2', 510, 610)
    //   } else if (mediaURL[0].marketName == 'LooksRare'){
    //     ctx.textAlign = "right";
    //     ctx.fillText(mediaURL[0].caption3, 450, 610)
    //     ctx.fillStyle = "#0edb62";
    //     ctx.textAlign = "left";
    //     ctx.fillText('LooksRare', 460, 610)
    //   } else if (mediaURL[0].marketName == 'blur'){
    //     ctx.textAlign = "right";
    //     ctx.fillText(mediaURL[0].caption3, 515, 610)
    //     ctx.fillStyle = "#f06007";
    //     ctx.textAlign = "left";
    //     ctx.fillText('Blur', 525, 610)
    //   }
    
    //ctx.drawImage(imgOpensea, 580, 630);
    //const emptyImg = await Jimp.read(1080, 1080, 0xffffff);

    //ctx.print(font, 10, 100, caption);
    //ctx.drawImage(emptyImg, 0, 0);
    const firstframeData = new ImageData(
        Uint8ClampedArray.from(firstframe.bitmap.data),
        firstframe.bitmap.width,
        firstframe.bitmap.height
    );
    ctx.putImageData(firstframeData, 0, 0);
    //ctx.drawImage(firstframe, 0, 0);
    encoder.addFrame(ctx);
    encoder.addFrame(ctx);
    encoder.setDelay(newDELAY);
    
    for (let i = 0; i < mediaURL.length; i++) {
        try{
        const image = (await Jimp.read(mediaURL[i].imageUrl)).resize(1080,1080);
        // await new Promise((resolve, reject) => setTimeout(resolve, 2000));
        await wait5sec(3000);
    // Resize the image to width 150 and heigth 150.
        image.quality(100)
        image.resize(1080, 1080);
        
    
        //image.print(font, 800, 20, `MEKA #${mediaURL[i].id}`);
        image.print(whiteFont50, -44, 20, {
            text: `#${mediaURL[i].id}`,
            alignmentX: Jimp.HORIZONTAL_ALIGN_RIGHT,
            alignmentY: Jimp.VERTICAL_ALIGN_TOP
        }, 1080, 1080);
        // image.print(blurFont, -38, 20, {
        //     text: `#${mediaURL[i].id}`,
        //     alignmentX: Jimp.HORIZONTAL_ALIGN_RIGHT,
        //     alignmentY: Jimp.VERTICAL_ALIGN_TOP
        // }, 1080, 1080);
        // image.print(openseaFont, -41, 20, {
        //     text: `#${mediaURL[i].id}`,
        //     alignmentX: Jimp.HORIZONTAL_ALIGN_RIGHT,
        //     alignmentY: Jimp.VERTICAL_ALIGN_TOP
        // }, 1080, 1080);
        //await image.writeAsync(`temp/cropped/${mediaURL[i].id}.jpg`);
        // const meka = fs.readFileSync(__dirname + `/temp/cropped/${mediaURL[i].id}.jpg`);
        // var img2 = new Image();
        // img2.src = meka;

        // const x = i*i;
        // const y = i*i;
        // console.log(x)
        const imageData = new ImageData(
            Uint8ClampedArray.from(image.bitmap.data),
            image.bitmap.width,
            image.bitmap.height
        );
        ctx.putImageData(imageData, 0, 0);
        //ctx.drawImage(firstframe, 0, 0);
        //encoder.addFrame(ctx);
        //ctx.drawImage(img2, 0, 0);
        //ctx.drawImage(img, 20, 20);
        
        encoder.addFrame(ctx);
        }catch(e){
            console.log("error in gif")
            console.log(e)
            return 'false';
        }
    }
    encoder.finish();
    console.log("Done making gif")
    return dstPath
    
  }


  async function tweetSweepGIF(tweetText, dstPath) {
    // Format our image to base64
        // var file=''
        // var processedGIF='';
        // if(filename !== 'false'){
        //   file = fs.readFileSync(__dirname + `/temp/output/${filename}.gif`);
        //   processedGIF = Buffer.from(file, 'binary').toString('base64')
        // }
    //console.log(`Successfully tweeted: ${tweetText}`);
    // Upload the item's image from OpenSea to Twitter & retrieve a reference to it
    //console.log(tweetText)
    //console.log(dstPath)
    //var x = 'a473a6ad32'
    //var filePath = path.join(__dirname, `/temp/output/${x}.gif`);
    // twitterClient.postMediaChunked({ file_path: dstPath.toString() }, (error, media, response) => {
    //     if (!error) {
    //         const tweet = {
    //             status: tweetText,
    //             media_ids: [media.media_id_string]
    //         };
    //         console.log(media.media_id_string)
    //         // twitterClient.post('statuses/update', tweet, (error, tweet, response) => {
    //         //     if (!error) {
    //         //         console.log(`Successfully tweeted: ${tweetText}`);
    //         //     } else {
    //         //         console.error(error);
    //         //     }
    //         // });
    //     } else {
    //         console.error(error);
    //     }
    // });
    console.log(tweetText)
    console.log(dstPath)
    try {
        const mediaId = await twitterClientV2.v1.uploadMedia(dstPath);
        console.log(mediaId);
        await twitterClientV2.v2.tweet({ text: tweetText, media: { media_ids: [mediaId] } })
        fs.unlinkSync(dstPath)
    } catch (e) {
        console.log("Upload GIF failed");
        console.log(e);
        //tweet(tweetText);
    }
  }


module.exports = {
    tweet: tweet,
    tweetWithImage: tweetWithImage,
    getBase64:getBase64,
    getGif:getGif,
    tweetSweepGIF:tweetSweepGIF,
    wait5sec:wait5sec
};