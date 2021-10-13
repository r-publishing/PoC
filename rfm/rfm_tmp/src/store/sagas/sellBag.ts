import { put, takeEvery } from 'redux-saga/effects';
import * as rchainToolkit from 'rchain-toolkit';
//import { deflate } from 'pako';
//import { v4 } from 'uuid';
import Swal from 'sweetalert2';

import KeyResolver from 'key-did-resolver';
import { getResolver as getRchainResolver } from 'rchain-did-resolver';
import { Secp256k1Provider } from 'key-did-provider-secp256k1';
import { DID } from 'dids';
//import { parse } from 'did-resolver';
//import { encodeBase64 } from 'dids/lib/utils';

import { store, getBagsData } from '../';
//import replacer from '../../utils/replacer';
import { getPrivateKey, HistoryState } from '../index';
//import { Users } from '../../users/users';

const { updatePursePriceTerm } = require('rchain-token');

const sellBag = function*(action: {
  type: string;
  payload: { bagId: string; registryUri: string, price: number };
}) {
  console.log('sell-bag', action.payload);
  const state: HistoryState = store.getState();
    const bagsData = getBagsData(state);
    console.log(bagsData);

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
    console.log(folder);
  if (!folder) {
    console.error('bagData/document not found');
    return;
  }

  let newBagId = action.payload.bagId;


  did.deauthenticate();

  const payload = { masterRegistryUri: action.payload.registryUri,
    boxId: state.reducer.user,
    contractId: `public_store`,
    price: action.payload.price,
    purseId: newBagId }

  const term2 = updatePursePriceTerm(payload);

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
    term2,
    privateKey,
    publicKey as string,
    1,
    4000000000,
    validAfterBlockNumberResponse
  );
    /*
  const deployOptions2 = yield rchainToolkit.utils.getDeployOptions(
    'secp256k1',
    timestamp,
    term,
    PRIVATE_KEY,
    PUBLIC_KEY as string,
    1,
    4000000000,
    validAfterBlockNumberResponse
  );
  */

  yield rchainToolkit.http.deploy(state.reducer.validatorUrl, deployOptions);

  //rchainToolkit.http.deploy(state.reducer.validatorUrl, deployOptions2);
    
  yield put({
    type: 'SELL_BAG_COMPLETED',
    payload: {},
  });
    
    Swal.fire({
      text: 'Listing is in progress',
      showConfirmButton: false,
      timer: 15000,
    });

    function notify() {
        Swal.fire({
            title: 'Success!',
            text: 'Listing complete',
            showConfirmButton: false,
            timer: 10000,
        })
    }
    setTimeout(() => { notify() }, 15000);

    localStorage.setItem('tour', '5');
    setTimeout(() => {
      window.location.reload();
    }, 15000);
  return true;
};

export const sellBagSaga = function*() {
  yield takeEvery('SELL_BAG', sellBag);
};
