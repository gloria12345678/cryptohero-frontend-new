import Cookie from 'js-cookie';
import { BigNumber } from 'bignumber.js';
import request from 'superagent';
import timeout from 'timeout-then';
import web3 from '@/web3';
import * as config from './contract/config.js';
import CryptoHeroCardABI from './contract/abi/CryptoHeroCard.json';
import ShareTokenABI from './contract/abi/ShareToken.json';

// Sometimes, web3.version.network might be undefined,
// as a workaround, use defaultNetwork in that case.
let network = config.defaultNetwork;
let CryptoHeroCardContract = new web3.eth.Contract(CryptoHeroCardABI, network.CryptoHeroCard);
let ShareTokenContract = new web3.eth.Contract(ShareTokenABI, network.Shareable);
web3.eth.net.getId().then((result) => {
  network = config.network[result];
  CryptoHeroCardContract = new web3.eth.Contract(CryptoHeroCardABI, network.CryptoHeroCard);
  ShareTokenContract = new web3.eth.Contract(ShareTokenABI, network.Shareable);
});

export class NasTool {
  static fromNasToWei(value) {
    return new BigNumber('1000000000000000000').times(value);
  }
  static fromWeiToNas(value) {
    if (value instanceof BigNumber) {
      return value.dividedBy('1000000000000000000');
    }
    return new BigNumber(value).dividedBy('1000000000000000000');
  }
}

let store = [];
let isInit = false;


export const init = async () => {
  await request
    .get('https://api.leancloud.cn/1.1/classes/ad')
    .set({
      'X-LC-Id': 'R6A46DH2meySCVNM1uWOoW2M-gzGzoHsz',
      'X-LC-Key': '8R6rGgpHa0Y9pq8uO53RAPCB',
    })
    .type('json')
    .accept('json')
    .then((response) => {
      if (response.body && response.body.results) {
        store = response.body.results;
      }
      isInit = true;
    });
};

init().then();

// export const getMe = async () => new Promise((resolve) => {
//   window.postMessage({
//     target: 'contentscript',
//     data: {
//     },
//     method: 'getAccount',
//   }, '*');
//   window.addEventListener('message', ({ data }) => {
//     if (data.data && data.data.account) {
//       resolve(data.data.account);
//     }
//   });
// });

export const getMe = async () => {
  if (!window.web3) {
    throw Error('NO_METAMASK');
  }
  const me = {};
  const accounts = await web3.eth.getAccounts();
  me.address = accounts[0];
  if (me.address) {
    me.balance = await web3.eth.getBalance(me.address);
    return me;
  }
  throw Error('METAMASK_LOCKED');
};


export const getAnnouncements = async () => {
  const response = await request
    .get('https://api.leancloud.cn/1.1/classes/announcement')
    .set({
      'X-LC-Id': 'R6A46DH2meySCVNM1uWOoW2M-gzGzoHsz',
      'X-LC-Key': '8R6rGgpHa0Y9pq8uO53RAPCB',
    })
    .type('json')
    .accept('json');

  if (response.body && response.body.results) {
    return response.body.results;
  }

  return [];
};

export const getGg = async (id, time = 0) => {
  if (!isInit) {
    return timeout((time + 1) * 500).then(() => getGg(id, time + 1));
  }

  const item = store.find(x => x.id === `${id}`);

  if (item && item.str) {
    return item.str;
  }

  return '';
};

export const setGg = async (id, str) => {
  const response = await request
    .get('https://api.leancloud.cn/1.1/classes/ad')
    .set({
      'X-LC-Id': 'R6A46DH2meySCVNM1uWOoW2M-gzGzoHsz',
      'X-LC-Key': '8R6rGgpHa0Y9pq8uO53RAPCB',
    })
    .type('json')
    .accept('json');
  if (response.body && response.body.results) {
    store = response.body.results;
  }
  const item = store.find(x => x.id === `${id}`);

  if (item) {
    // update request
    await request
      .put(`https://api.leancloud.cn/1.1/classes/ad/${item.objectId}`)
      .set({
        'X-LC-Id': 'R6A46DH2meySCVNM1uWOoW2M-gzGzoHsz',
        'X-LC-Key': '8R6rGgpHa0Y9pq8uO53RAPCB',
      })
      .type('json')
      .accept('json')
      .send({
        str,
      });
    // update store
    item.str = str;
  } else {
    // create request
    await request
      .post('https://api.leancloud.cn/1.1/classes/ad')
      .set({
        'X-LC-Id': 'R6A46DH2meySCVNM1uWOoW2M-gzGzoHsz',
        'X-LC-Key': '8R6rGgpHa0Y9pq8uO53RAPCB',
      })
      .type('json')
      .accept('json')
      .send({
        id: `${id}`,
        str,
      });
    // update store
    await init();
  }

  return str;
};


export function getDrawCount(value, drawPrice) {
  let result = 0;
  let offset = 0;
  while (value > drawPrice + offset) {
    result += 1;
    value -= drawPrice + offset;
    offset += NasTool.fromNasToWei(0.0001);
  }
  return result;
}


export const getLocale = async () => (
  Cookie.get('locale') ||
  (
    navigator.language ||
    navigator.browserLanguage ||
    navigator.userLanguage
  ).toLowerCase()
);

export const setLocale = async (locale) => {
  Cookie.set('locale', locale, { expires: 365 });
};

