// external

const { ethers } = require('ethers');
const retry = require('async-retry');
const _ = require('lodash');
const { Alchemy, Network, Contract } = require('alchemy-sdk');
// local
const { markets } = require('./markets.js');
const { getTokenData, getSeaportSalePrice, getLooksrareTokenData, getUsername, getUSDValue, getStats, getSlug } = require('./utils.js');
const { currencies } = require('./currencies.js');
const { transferEventTypes, saleEventTypes } = require('./log_event_types.js');
const { tweet, tweetWithImage, getBase64, tweetSweep, getGif, tweetSweepGIF } = require('./tweet.js');
const abi = require('./abi.json');
const marketABI = require('./marketABI.json');
const Queue = require('queue-fifo');
const lineQ = new Queue()
const lineSweepQ = new Queue()
const lineSweepIndividualQ = new Queue()


const events = require('events');
//const rarityObj = JSON.parse(rarity);
require('dotenv').config();
const twit = require('twit');
//const rarityObj = JSON.parse(rarity);
require('dotenv').config();
const twitterConfig = {
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
};

const twitterClient = new twit(twitterConfig);
const web3 = new Alchemy({
  apiKey: process.env.ALCHEMY_API_KEY, // Replace with your Alchemy API Key.
  network: Network.ETH_MAINNET, // Replace with your network.
});
// connect to Alchemy websocket
// const web3 = createAlchemyWeb3(
//   `wss://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`
// );

// sometimes web3.js can return duplicate transactions in a split second, so
let lastTransactionHash;
//lineQ.enqueue({'tokens':[2787],'transactionHash':'0x72e65a47280b324e06246f27cf3864a6129749664e24f9632eb878f046ae3b7e','totalPrice':0.023,'currency':{name: 'ETH',symbol: 'Ξ',decimals: 18,threshold: 1,},'market':{name: 'Opensea ⚓️',site: 'https://opensea.io/assets/ethereum/'},'buyer': '0x3cd791ba8feeE0C4763941159073Ba8993749255', 'seller': '0x5B944B5C79e42396eeF532826bd46a48Bc09Bf8F'});
//lineSweepQ.enqueue({'tokens':[661, 4334],'transactionHash':'0x8c93afa8d0a2b8a0d6aa820db644271ccff794d0f6dde70eae39bff80550786d','totalPrice':0.127,'currency':{name: 'ETH',symbol: 'Ξ',decimals: 18,threshold: 1,},'market':{name: 'Opensea ⚓️',site: 'https://opensea.io/assets/ethereum/'},'buyer': '0x0ba07ad85EA848194e55dE66060C9C9DdB92ad85', 'seller': '0x7AfEFBa5baa5ED3a6A6F2568ad1627B03213da2F'});
async function monitorContract() {
  //let parsedABI = JSON.parse(abi);
  const provider = await web3.config.getWebSocketProvider();
  const contract = new Contract(process.env.CONTRACT_ADDRESS, abi, provider);
  const interface = new ethers.utils.Interface(marketABI);
  

  contract.on('Transfer', async (...params) => {

      const event = params[params.length - 1];
      const transactionHash = event.transactionHash.toLowerCase();

      // duplicate transaction - skip process
      if (transactionHash == lastTransactionHash) {
        return;
      }

      lastTransactionHash = transactionHash;

      // attempt to retrieve the receipt, sometimes not available straight away
      const receipt = await retry(
        async (bail) => {
          const rec = await web3.core.getTransactionReceipt(transactionHash);

          if (rec == null) {
            throw new Error('receipt not found, try again');
          }

          return rec;
        },
        {
          retries: 5,
        }
      );

      const recipient = receipt.to.toLowerCase();
      // const gem = {'0x83c8f28c26bf6aaca652df1dbbe0e1b56f8baba2':'gem','0x0000000031f7382a812c64b604da4fc520afef4b':'gem','0x0000000035634b55f3d99b071b5a354f48e10bef':'gem','0x00000000a50bb64b4bbeceb18715748dface08af':'gem','0xae9c73fd0fd237c1c6f66fe009d24ce969e98704':'gem'}
      // const genie = {'0x0a267cf51ef038fc00e71801f5a524aec06e4f07':'genie'}
      // const sudo = {'0x2b2e8cda09bba9660dca5cb6233787738ad68329':'sudo'};
      const blur = {'0x39da41747a83aee658334415666f3ef92dd0d541':'blur','0x000000000000ad05ccc4f10045630fb830b95127':'blur'};
      const element = {'0xb4e7b8946fa2b35912cc0581772cccd69a33000c':'element'}

      if(recipient in blur || recipient in element){
        //console.log("It is gem sweep")
        let currency = {
          name: 'ETH',
          symbol: 'Ξ',
          decimals: 18,
          threshold: 1,
        };
        let tokens = [];
        let totalPrice = 0;
        let buyer;
        let seller;
        //let isPriceCalculated = false;
        let countPriceCal = 0;
  
        for (let log of receipt.logs) {
          const logAddress = log.address.toLowerCase();
          if (logAddress in currencies) {
            currency = currencies[logAddress];
          }
          // token(s) part of the transaction
          if (log.data == '0x' && transferEventTypes.includes(log.topics[0]) && logAddress == process.env.CONTRACT_ADDRESS.toLowerCase()  ) {
            const tokenId = ethers.BigNumber.from(log.topics[3]).toString();
            buyer = ethers.utils.defaultAbiCoder.decode(['address'], log.topics[2]).toString();
            seller = ethers.utils.defaultAbiCoder.decode(['address'], log.topics[1]).toString();
            //console.log("buyer is - " + buyer);
            tokens.push(tokenId);
          }

          if(logAddress in markets){
            const market = _.get(markets, logAddress);
            //console.log("Market name is " + market.name)
            //if(market.name ==='gem' || market.name==='genie'|| market.name==='sudo') continue;
            //console.log(log);
            // if non-ETH transaction
            
            //console.log(log);
            
    
            // transaction log - decode log in correct format depending on market & retrieve price
            if (saleEventTypes.includes(log.topics[0])) {
              // const decodedLogData = web3.eth.abi.decodeLog(
              //   market.logDecoder,
              //   log.data,
              //   []
              // );
              const decodedLogData = interface.parseLog({
                data: log.data,
                topics: [...log.topics]
              })?.args;
              //console.log(decodedLogData);
              countPriceCal = countPriceCal + 1;  
              if (market.name == 'Opensea ⚓️') {
                //console.log("name is "+ market.name + " - "+ logAddress)
                totalPrice += Number(getSeaportSalePrice(decodedLogData, process.env.CONTRACT_ADDRESS.toLowerCase()))
                //totalPrice += (x + (x*0.025));
              } else if (market.name == 'X2Y2 ⭕️') {
                totalPrice += Number(ethers.utils.formatUnits(
                  decodedLogData.amount,
                  currency.decimals
                ));
                //totalPrice += (x + (x*0.005));
              } else if (market.name == 'LooksRare 👀💎'){
                totalPrice += Number(ethers.utils.formatUnits(
                  decodedLogData.price,
                  currency.decimals
                ));
                //totalPrice += (x + (x*0.02));
              } else if (market.name == 'blur'){
                totalPrice += Number(ethers.utils.formatUnits(
                  decodedLogData.sell.price,
                  currency.decimals
                ));
              } else{
                 totalPrice += Number(ethers.utils.formatUnits(
                  decodedLogData.price,
                  currency.decimals
                ));
                //totalPrice += (x + (x*0.025));
              }
            }
          }
        }
          
          if(totalPrice == 0){
            return;
          } 
          // remove any dupes
          tokens = _.uniq(tokens);
          if(tokens.length>1){
              console.log("token > 1")
              //console.log("Total price at top is - " + totalPrice);
              //console.log("No. of tokens are - " + tokens.length);
              //console.log(`https://etherscan.io/tx/${transactionHash}`)
              console.log("This is sweep");
              lineSweepQ.enqueue({'tokens':tokens,'transactionHash':transactionHash,'totalPrice':totalPrice,'currency':currency,'market':{name: 'blur',site: 'https://opensea.io/assets/ethereum/'},'buyer': buyer, 'seller': seller, 'recepient':recipient});
          }else{
            console.log("token = 1")
            if(tokens.length + 1 ==countPriceCal){
              console.log("Looks like private sale");
              console.log("Previous total price" + totalPrice);
              totalPrice = totalPrice / 2;
              console.log("Updated total price" + totalPrice);
            }
            //console.log("tokens are - " + tokens)
            //console.log("Total price at top is - " + totalPrice);
            //console.log(`https://etherscan.io/tx/${transactionHash}`)
            lineQ.enqueue({'tokens':tokens,'transactionHash':transactionHash,'totalPrice':totalPrice,'currency':currency,'market':{name: 'Opensea ⚓️',site: 'https://opensea.io/assets/ethereum/'},'buyer': buyer, 'seller': seller});
          }
      }
      // not a marketplace transaction transfer, skip
        else if (recipient in markets) {
        // not a marketplace transaction transfer, skip

        // retrieve market details
        const market = _.get(markets, recipient);

        // default to eth, see currencies.js for currently support currencies
        let currency = {
          name: 'ETH',
          symbol: 'Ξ',
          decimals: 18,
          threshold: 1,
        };
        let tokens = [];
        let totalPrice = 0;
        let buyer;
        let seller;
        let countPriceCal = 0;

        for (let log of receipt.logs) {
          const logAddress = log.address.toLowerCase();
          //console.log(log);
          // if non-ETH transaction
          if (logAddress in currencies) {
            currency = currencies[logAddress];
          }

          // token(s) part of the transaction
          if (log.data == '0x' && transferEventTypes.includes(log.topics[0]) && logAddress == process.env.CONTRACT_ADDRESS.toLowerCase() ) {
            const tokenId = ethers.BigNumber.from(log.topics[3]).toString();
            buyer = ethers.utils.defaultAbiCoder.decode(['address'], log.topics[2]).toString();
            seller = ethers.utils.defaultAbiCoder.decode(['address'], log.topics[1]).toString();
            //console.log(log);
            tokens.push(tokenId);
          }

          // transaction log - decode log in correct format depending on market & retrieve price
          if (logAddress == recipient && saleEventTypes.includes(log.topics[0])) {
            const decodedLogData = interface.parseLog({
              data: log.data,
              topics: [...log.topics]
            })?.args;
            //console.log(decodedLogData)
            countPriceCal = countPriceCal + 1;  
            if (market.name == 'Opensea ⚓️') {
              //console.log("name is "+ market.name)
              totalPrice += Number(getSeaportSalePrice(decodedLogData, process.env.CONTRACT_ADDRESS.toLowerCase()));
            } else if (market.name == 'X2Y2 ⭕️') {
              totalPrice += Number(ethers.utils.formatUnits(
                decodedLogData.amount,
                currency.decimals
              ));
            } else if (market.name == 'blur'){
              totalPrice += Number(ethers.utils.formatUnits(
                decodedLogData.sell.price,
                currency.decimals
              ));
            } else {
              totalPrice += Number(ethers.utils.formatUnits(
                decodedLogData.price,
                currency.decimals
              ));
            }
          }
        }
        
        if(totalPrice == 0){
          return;
        }

        // remove any dupes
        tokens = _.uniq(tokens);
        if(tokens.length>1){
          console.log("token > 1")
          lineSweepQ.enqueue({'tokens':tokens,'transactionHash':transactionHash,'totalPrice':totalPrice,'currency':currency,'market':market,'buyer': buyer, 'seller': seller, 'recepient':recipient});
        }else{
          console.log("token = 1")
          if(tokens.length + 1 ==countPriceCal){
            console.log("Previous total price" + totalPrice);
            totalPrice = totalPrice / 2;
            console.log("Updated total price" + totalPrice);
          }
          lineQ.enqueue({'tokens':tokens,'transactionHash':transactionHash,'totalPrice':totalPrice,'currency':currency,'market':market,'buyer': buyer, 'seller': seller});
          }
        }else{
          return;
        }
    })

}

// initate websocket connection
monitorContract();

// Mekabot single Emitter
const lineEmitter = new events.EventEmitter() // From the 'events' module
lineEmitter.on('processNextLine', async () => {
  //console.log("10 seconds passed");
  if (!lineQ.isEmpty()){ 
    //console.log("Processing Next line");
    let queueData = lineQ.dequeue();
    //console.log(queueData);
    let tokens = queueData['tokens'];
    let transactionHash = queueData['transactionHash'];
    let totalPrice = queueData['totalPrice'];
    let currency = queueData['currency'];
    let market = queueData['market'];
    let stats = await getSlug(process.env.OPENSEA_COLLECTION_SLUG);
    
    buyer = queueData['buyer']; 
    buyerName = await getUsername(buyer);
    let USDValue = 0;
    if(currency.name === 'ETH' || currency.name === 'WETH'){
      USDValue = await getUSDValue(currency.name);
    }
    let soldOrBought ="bought"
    if(currency.name === 'WETH'){
      soldOrBought="sold"
    }
    const tokenData = await getTokenData(process.env.CONTRACT_ADDRESS,tokens[0]);
    console.log("tokendata is " + tokenData)
      console.log("Image link was");
      console.log(_.get(tokenData, 'image_url'));
      tweetWithImage(
        `✨ New Sale on The Spectrum ✨\n
${_.get(tokenData,'assetName',`#` + tokens[0])} ${soldOrBought} by [redacted] for ${(+totalPrice).toFixed(3)} ${currency.name} ${currency.name === 'ETH' || currency.name === 'WETH'? `($${(+(USDValue.amount*totalPrice)).toFixed(0)})`: ``}
\n${process.env.HASHTAGS}
\b${market.site}${process.env.CONTRACT_ADDRESS}/${tokens[0]}`,
        _.get(tokenData, 'image_url' )
      );
  }
})
setInterval( () => lineEmitter.emit('processNextLine'), 20000) 



const lineSweepEmitter = new events.EventEmitter() // From the 'events' module
lineSweepEmitter.on('processNextSweep', async () => {
  //console.log("40 seconds passed to check sweep");
  let interval = 0;
  let buyer="";
  let buyerName="";
  
  if (!lineSweepQ.isEmpty()){ 
    //console.log("Processing Next line");
    let stats;
    let queueData = lineSweepQ.dequeue();
    //console.log(queueData);
    let tokens = queueData['tokens'];
    let transactionHash = queueData['transactionHash'];
    let totalPrice = queueData['totalPrice'];
    let currency = queueData['currency'];
    let market = queueData['market'];
    if(buyer.length == 0){
      stats = await getSlug(process.env.OPENSEA_COLLECTION_SLUG);
      buyer = queueData['buyer']; 
      buyerName = await getUsername(buyer);
    }
    let recepient = queueData['recepient']
    let USDValue = 0;
    if(currency.name === 'ETH' || currency.name === 'WETH'){
      USDValue = await getUSDValue(currency.name);
    }
    let soldOrBought ="bought"
    if(currency.name === 'WETH'){
      soldOrBought="sold"
    }
    let length = tokens.length>30? 30:tokens.length;
    for (let i = 0; i < length; i++) {
      lineSweepIndividualQ.enqueue(tokens[i]);
    }
    const lineSweepIndividualEmitter = new events.EventEmitter()
    let mediaURL = [];
    lineSweepIndividualEmitter.on('processNextSweepIndividual', async () => {
      console.log("next sweep data");
      let marketName = ''
      if (market.name == 'Opensea ⚓️') {
        marketName = 'Opensea';
      } else if (market.name == 'X2Y2 ⭕️') {
        marketName = 'X2Y2';
      } else if (market.name == 'LooksRare 👀💎'){
        marketName = 'LooksRare';
      } else if (market.name == 'blur'){
        marketName = 'blur';
      }
      if (!lineSweepIndividualQ.isEmpty()){ 
        let data = lineSweepIndividualQ.dequeue();
        let x = await getTokenData(process.env.CONTRACT_ADDRESS,data);
        let imageUrl = _.get(x, 'image_url','false' )
        if(imageUrl !== 'false'){
          var caption1 =  `${tokens.length} ${process.env.TOKEN_NAME}s`;
          var caption2 =  `${soldOrBought} for ${(+totalPrice).toFixed(3)} ${currency.name} ${currency.name === 'ETH' || currency.name === 'WETH'? `($${(+(USDValue.amount*totalPrice)).toFixed(0)})`: ``}`
          var caption3 =  `on`
          mediaURL.push({imageUrl:imageUrl,id:data,marketName:marketName,tokens:tokens,caption1:caption1,caption2:caption2,caption3:caption3});
        }
      }else{
        console.log("Interval cleared - " + interval);
        clearInterval(interval);
        //console.log('isGIF -' +  GIFfile)
        let buyerLabel = ``;
        //console.log("media ids are" + mediaID);
         var dstPath = await getGif(mediaURL)
         //console.log("dspath is after creating file is - " + dstPath)
          if(dstPath !== 'false'){
            let caption =``;
            caption = caption + `✨ New Sale on The Spectrum ✨\n
${tokens.length} ${process.env.TOKEN_NAME}s ${soldOrBought} by [redacted] for ${(+totalPrice).toFixed(3)} ${currency.name} ${currency.name === 'ETH' || currency.name === 'WETH'? `($${(+(USDValue.amount*totalPrice)).toFixed(0)})`: ``}`
            if(recepient in {'0x39da41747a83aee658334415666f3ef92dd0d541':'blur','0x000000000000ad05ccc4f10045630fb830b95127':'blur'}){
              tweetSweepGIF(`${caption}
\n${process.env.HASHTAGS}
\bhttps://etherscan.io/tx/${transactionHash}`
          ,dstPath)
            }else{
         tweetSweepGIF(`${caption}
\n${process.env.HASHTAGS}
\bhttps://etherscan.io/tx/${transactionHash}`
          ,dstPath)
            }
          }
          else{
            console.log("failed gif")
            let caption =``;
            caption = caption + `✨ New Sale on The Spectrum ✨\n
${tokens.length} ${process.env.TOKEN_NAME}s ${soldOrBought} by [redacted] for ${(+totalPrice).toFixed(3)} ${currency.name} ${currency.name === 'ETH' || currency.name === 'WETH'? `($${(+(USDValue.amount*totalPrice)).toFixed(0)})`: ``}`
            if(recepient in {'0x39da41747a83aee658334415666f3ef92dd0d541':'blur','0x000000000000ad05ccc4f10045630fb830b95127':'blur'}){
              tweet(`${caption}
\n${process.env.HASHTAGS}
\bhttps://etherscan.io/tx/${transactionHash}`
              )
            }else{
            tweet(`${caption}
\n${process.env.HASHTAGS}
\bhttps://etherscan.io/tx/${transactionHash}`
             )
            }
          }
      }
    })
    interval = setInterval( () => lineSweepIndividualEmitter.emit('processNextSweepIndividual'), 15000);
    console.log("Interval started - " + interval);
  }
  //if (!lineQ.isEmpty()) lineEmitter.emit('processNextLine')
})

setInterval( () => lineSweepEmitter.emit('processNextSweep'), 100000) 
