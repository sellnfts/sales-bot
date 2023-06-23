// external
const axios = require('axios');
const retry = require('async-retry');
const _ = require('lodash');
const { ethers } = require('ethers');
require('dotenv').config();
// local
const { currencies } = require('./currencies.js');

function _reducer(previous, current) {
  const currency = currencies[current.token.toLowerCase()];

  if (currency !== undefined) {
    const result =
      previous +
      Number(ethers.utils.formatUnits(current.amount, currency.decimals));

    return result;
  } else {
    return previous;
  }
}

function getSeaportSalePrice(decodedLogData, address) {
  const offer = decodedLogData.offer;
  const consideration = decodedLogData.consideration;

  const offerSideNfts = offer.some(
    (item) =>
      item.token.toLowerCase() === address
  );

  const considerationSideNfts = consideration.some(
    (item) =>
      item.token.toLowerCase() === address
  );
    
  if (!offerSideNfts && !considerationSideNfts) return null;

  // if nfts are on the offer side, then consideration is the total price, otherwise the offer is the total price
  if (offerSideNfts) {
    const totalConsiderationAmount = consideration.reduce(_reducer, 0);
    
    return totalConsiderationAmount;
  } else {
    const totalOfferAmount = offer.reduce(_reducer, 0);
    
    return totalOfferAmount;
  }
}

async function getTokenData(contract, tokenId) {
  try {
    const assetName = await retry(
      async (bail) => {
        // retrieve metadata for asset from opensea
        const response = await axios.get(
          // `https://api.opensea.io/api/v1/asset/${process.env.MEKA_CONTRACT_ADDRESS}/${tokenId}`
          //`https://api.themekaverse.com/bot/${tokenId}`
          `https://api.opensea.io/api/v1/asset/${contract}/${tokenId}`
          ,
          {
            headers: {
              'X-API-KEY': process.env.X_API_KEY,
            },
          }
        );
        
        const data = response.data;

        
        //const data = response.data.data;
        //console.log(data.attributes.filter(function(e){ return e.trait_type == 'Meka Type' })[0]['value']);
        // just the asset name for now, but retrieve whatever you need
        //console.log( _.get(data, 'image_url'))
        let newImageurl = _.get(data, 'image_url').replace("?w=500", "?w=1080")
        return {
          assetName: _.get(data, 'name'),
          image_url: newImageurl
        };
        // return {
        //   assetName: _.get(data, 'name'),
        //   image_url: _.get(data, 'image')
        // };
        // return {
        //   assetName: _.get(data, 'name'),
        //   image_url: _.get(data, 'imageURI')
        // };
      }
      ,
      {
        retries: 1,
        minTimeout: 5000
      }
    );

    return assetName;
  } catch (error) {
    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
    } else {
      console.error(error.message);
    }
  }
}


async function getLooksrareTokenData(tokenId) {
  console.log("token id is - " + tokenId)
  try {
    const assetName = await retry(
      async (bail) => {
        // retrieve metadata for asset from opensea
        const response = await axios.get(
          `https://api.looksrare.org/api/v1/tokens?collection=${process.env.CONTRACT_ADDRESS}&tokenId=${parseInt(tokenId)}`
          // `https://api.themekaverse.com/bot/${tokenId}`
        );
        
        const data = response.data.data;
        
        //return obj;
        return {
          assetName: _.get(data, 'name'),
          image_url: _.get(data, 'imageURI')
        }; 
      },
      {
        retries: 1,
        minTimeout: 5000
      }
    );

    return assetName;
  } catch (error) {
    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
    } else {
      console.error(error.message);
    }
  }
}


async function getUsername(buyer) {
  //console.log("token id is - " + tokenId)
  try {
    const assetName = await retry(
      async (bail) => {
        // retrieve metadata for asset from opensea
        const response = await axios.get(
           //`https://api.opensea.io/api/v1/asset/${process.env.MEKA_CONTRACT_ADDRESS}/${parseInt(tokenId)}`
          //`https://ipfs.io/ipfs/Qmcob1MaPTXUZt5MztHEgsYhrf7R6G7wV8hpcweL8nEfgU/meka/${tokenId}`
          `https://api.opensea.io/api/v1/user/${buyer}`
          ,
          {
            headers: {
              'X-API-KEY': process.env.X_API_KEY,
            },
          }
        );
        
        const data = response.data;
        //console.log(data);
        //console.log(data.attributes.filter(function(e){ return e.traitType == 'Meka Type' })[0]['value']);
        // just the asset name for now, but retrieve whatever you need
        // return {
        //   assetName: _.get(data, 'name'),
        //   image_url: _.get(data, 'image'),
        //   mekaType: data.attributes.filter(function(e){ return (e.trait_type == 'Meka Type' || e.trait_type == 'Legendary') })[0]['value']
        // };
        
          return {
            username: _.get(data, 'username')
          };  
      },
      {
        retries: 0,
        minTimeout: 5000
      }
    );

    return assetName;
  } catch (error) {
    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
    } else {
      console.error(error.message);
    }
  }
}


async function getUSDValue(currency) {
  //console.log("token id is - " + tokenId)
  try {
    const assetName = await retry(
      async (bail) => {
        // retrieve metadata for asset from opensea
        const response = await axios.get(
           //`https://api.opensea.io/api/v1/asset/${process.env.MEKA_CONTRACT_ADDRESS}/${parseInt(tokenId)}`
          //`https://ipfs.io/ipfs/Qmcob1MaPTXUZt5MztHEgsYhrf7R6G7wV8hpcweL8nEfgU/meka/${tokenId}`
          `https://api.coinbase.com/v2/exchange-rates?currency=${currency}`
          // ,
          // {
          //   headers: {
          //     'X-API-KEY': process.env.X_API_KEY,
          //   },
          // }
        );
        
        const data = response.data.data.rates.USD;
        console.log(data);
        //console.log(data.attributes.filter(function(e){ return e.traitType == 'Meka Type' })[0]['value']);
        // just the asset name for now, but retrieve whatever you need
        // return {
        //   assetName: _.get(data, 'name'),
        //   image_url: _.get(data, 'image'),
        //   mekaType: data.attributes.filter(function(e){ return (e.trait_type == 'Meka Type' || e.trait_type == 'Legendary') })[0]['value']
        // };
        
          return {
            amount: data
          };  
      },
      {
        retries: 0,
        minTimeout: 5000
      }
    );

    return assetName;
  } catch (error) {
    if (error.response) {
      console.log(error.response);
    } else {
      console.error(error);
    }
  }
}


async function getStats(address) {
  //console.log("token id is - " + tokenId)
  try {
    const assetName = await retry(
      async (bail) => {
        // retrieve metadata for asset from opensea
        const response = await axios.get(
           //`https://api.opensea.io/api/v1/asset/${process.env.MEKA_CONTRACT_ADDRESS}/${parseInt(tokenId)}`
          //`https://ipfs.io/ipfs/Qmcob1MaPTXUZt5MztHEgsYhrf7R6G7wV8hpcweL8nEfgU/meka/${tokenId}`
          `https://rutherford.5.dev/api/scores/${address}`
          ,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + process.env.Intelli,
            },
          }
        );
        
        const data = response.data;
        //console.log(data);
        //console.log(data.attributes.filter(function(e){ return e.traitType == 'Meka Type' })[0]['value']);
        // just the asset name for now, but retrieve whatever you need
        // return {
        //   assetName: _.get(data, 'name'),
        //   image_url: _.get(data, 'image'),
        //   mekaType: data.attributes.filter(function(e){ return (e.trait_type == 'Meka Type' || e.trait_type == 'Legendary') })[0]['value']
        // };
        
          return {
            coilBalance: _.get(data.portfolioStats, 'coinPortfolioValue'),
            nftValue: _.get(data.portfolioStats, 'collectiblePortfolioValue'),
            labels: _.get(data, 'labels')
          };  
      },
      {
        retries: 0,
        minTimeout: 5000
      }
    );

    return assetName;
  } catch (error) {
    if (error.response) {
      console.log(error.response);
      return {
        error:true,
        coilBalance: 0,
        nftValue: 0,
        labels: []
      }; 
    } else {
      console.error(error);
      return {
        error:true,
        coilBalance: 0,
        nftValue: 0,
        labels: []
      }; 
    }
  }
}


async function getSlug(slug) {
  //console.log("token id is - " + tokenId)
  try {
    const assetName = await retry(
      async (bail) => {
        // retrieve metadata for asset from opensea
        const response = await axios.get(
           //`https://api.opensea.io/api/v1/asset/${process.env.MEKA_CONTRACT_ADDRESS}/${parseInt(tokenId)}`
          //`https://ipfs.io/ipfs/Qmcob1MaPTXUZt5MztHEgsYhrf7R6G7wV8hpcweL8nEfgU/meka/${tokenId}`
          `https://api.opensea.io/collection/${slug}`
          ,
          {
            headers: {
              'X-API-KEY': process.env.X_API_KEY,
            },
          }
        );
        
        const data = response.data.collection;
        //console.log(data);
        //console.log(data.attributes.filter(function(e){ return e.traitType == 'Meka Type' })[0]['value']);
        // just the asset name for now, but retrieve whatever you need
        // return {
        //   assetName: _.get(data, 'name'),
        //   image_url: _.get(data, 'image'),
        //   mekaType: data.attributes.filter(function(e){ return (e.trait_type == 'Meka Type' || e.trait_type == 'Legendary') })[0]['value']
        // };
        
          return {
            stats: _.get(data, 'stats')
          };  
      },
      {
        retries: 0,
        minTimeout: 5000
      }
    );

    return assetName;
  } catch (error) {
    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
      return {
        stats: {floor_price:null}
      };
    } else {
      console.error(error.message);
      return {
        stats: {floor_price:null}
      };
    }
  }
}



module.exports = {
  getSeaportSalePrice: getSeaportSalePrice,
  getTokenData: getTokenData,
  getLooksrareTokenData:getLooksrareTokenData,
  getUsername:getUsername,
  getUSDValue:getUSDValue,
  getStats:getStats,
  getSlug:getSlug
  
};
