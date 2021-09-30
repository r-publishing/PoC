import { put, takeEvery } from 'redux-saga/effects';
import * as rchainToolkit from 'rchain-toolkit';
import { deflate } from 'pako';
import Swal from 'sweetalert2';

import KeyResolver from 'key-did-resolver';
import { getResolver as getRchainResolver } from 'rchain-did-resolver';
import { Secp256k1Provider } from 'key-did-provider-secp256k1';
import { DID } from 'dids';
//import { parse } from 'did-resolver';
import { encodeBase64 } from 'dids/lib/utils';

import { Folder, store, getBagsData } from '../';
import replacer from '../../utils/replacer';
import { getPrivateKey, HistoryState } from '../index';

const { createPursesTerm } = require('rchain-token');

const publishBagData = function*(action: {
  type: string;
  payload: { bagId: string; registryUri: string, price: number};
}) {
  console.log('reuploload-bag-data', action.payload);
  const state: HistoryState = store.getState();
  const bagsData = getBagsData(state);

  const publicKey = state.reducer.publicKey;
  const privateKey = yield getPrivateKey(state);

  const did = new DID({
    resolver: { ...(yield getRchainResolver()), ...KeyResolver.getResolver() },
  });
  const authSecret = Buffer.from(privateKey, 'hex');
  const provider = new Secp256k1Provider(authSecret);

  yield did.authenticate({ provider: provider });

  const folder =
    bagsData[`${action.payload.registryUri}/${action.payload.bagId}`];
  if (!folder) {
    console.error('bagData/document not found');
    return;
  }

  let newBagId = action.payload.bagId;

  const signedDocument = {
    ...folder,
    date: folder.date,
  };

  const fileDocument = {
    ...signedDocument,
  } as Folder;

  
  const { jws, linkedBlock } = yield did.createDagJWS(fileDocument);
  const jwsToken = { jws: jws, data: encodeBase64(linkedBlock) };

  const stringifiedJws = JSON.stringify(jwsToken, replacer);
  const deflatedJws = deflate(stringifiedJws);
  const gzipped = Buffer.from(deflatedJws).toString('base64');

  let parsedPriceInDust = action.payload.price * 100000000;

  const payload = {
    purses: {
      [newBagId]: {
        id: newBagId, // will be ignored, contract is fugible contract
        boxId: state.reducer.user,
        type: '0',
        quantity: 1,
        price: parsedPriceInDust,
      }
    },
    data: {
      [newBagId]: gzipped
    },
    masterRegistryUri: state.reducer.registryUri,
    contractId: "public_store",
    boxId: state.reducer.user,
  };

  did.deauthenticate();
  
  const term = createPursesTerm(payload);
  
  let validAfterBlockNumberResponse;
  try {
    validAfterBlockNumberResponse = JSON.parse(
      yield rchainToolkit.http.blocks(state.reducer.readOnlyUrl, {
        position: 1,
      })
    )[0].blockNumber;
  } catch (err) {
    console.log(err);
    throw new Error('Unable to get last finalized block');
  }
  
  const timestamp = new Date().getTime();
  const deployOptions = yield rchainToolkit.utils.getDeployOptions(
    'secp256k1',
    timestamp,
    term,
    privateKey,
    publicKey as string,
    1,
    4000000000,
    validAfterBlockNumberResponse
  );
  yield rchainToolkit.http.deploy(state.reducer.validatorUrl, deployOptions);
  

  yield put({
    type: 'PURCHASE_BAG_COMPLETED',
    payload: {},
  });

  Swal.fire({
    text: 'Publishing is in progress',
    showConfirmButton: false,
    timer: 15000,
  });


 function notify() {
        Swal.fire({
            title: 'Success!',
            text: 'Publishing complete',
            showConfirmButton: false,
            timer: 10000,
        })
    }
    setTimeout(() => { notify() }, 15000);

  setTimeout(() => {
    window.location.reload();
  }, 15000);
  return true;
};

export const publishBagDataSaga = function*() {
  yield takeEvery('PUBLISH_BAG_DATA', publishBagData);
};
