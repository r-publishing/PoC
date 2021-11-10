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
import prepareDeploy from '../../utils/prepareDeploy';
import waitForUnforgeable from '../../utils/waitForUnforgeable';
//import validAfterBlockNumber from '../../utils/validAfterBlockNumber';
import { getPrivateKey, HistoryState } from '../index';

const { createPursesTerm } = require('rchain-token');

function notify() {
  Swal.fire({
      title: 'Success!',
      text: 'Publishing complete',
      showConfirmButton: false,
      timer: 5000,
      didClose: () => {
        localStorage.setItem('tour', '3');
        window.location.reload();
      }
  })
}

const publishBagData = function*(action: {
  type: string;
  payload: { bagId: string; registryUri: string, price: number, fees: Array<{
    revAddress: string;
    fraction100: number;
}>};
}) {
  console.log('reuploload-bag-data', action.payload);
  const state: HistoryState = store.getState();
  const bagsData = getBagsData(state);

  const publicKey = state.reducer.publicKey;
  const privateKey = yield getPrivateKey(state);
  //const revAddr = rchainToolkit.utils.revAddressFromPublicKey(publicKey || "");

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
        id: newBagId,
        boxId: state.reducer.user,
        type: '0',
        quantity: 1,
        price: parsedPriceInDust,
        //fees: action.payload.fees
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
  const pd = yield prepareDeploy(
    state.reducer.readOnlyUrl,
    publicKey as string,
    timestamp
  );

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
  const deployResponse = yield rchainToolkit.http.deploy(state.reducer.validatorUrl, deployOptions);
  if (deployResponse.startsWith('"Success!')) {
    Swal.fire({
      text: 'Publishing is in progress',
      showConfirmButton: false,
    });
  }
  
  yield waitForUnforgeable(JSON.parse(pd).names[0], state.reducer.readOnlyUrl);

  notify();

  yield put({
    type: 'PURCHASE_BAG_COMPLETED',
    payload: {},
  });


  return true;
};

export const publishBagDataSaga = function*() {
  yield takeEvery('PUBLISH_BAG_DATA', publishBagData);
};
