import { put, takeEvery } from 'redux-saga/effects';
import * as rchainToolkit from 'rchain-toolkit';
import { deflate } from 'pako';
//import { v4 } from 'uuid';
import Swal from 'sweetalert2';

import KeyResolver from 'key-did-resolver';
import { getResolver as getRchainResolver } from 'rchain-did-resolver';
import { Secp256k1Provider } from 'key-did-provider-secp256k1';
import { DID } from 'dids';
import { encodeBase64 } from 'dids/lib/utils';
//import { parse } from 'did-resolver';

import { Folder, store } from '../';
import replacer from '../../utils/replacer';
import { getPrivateKey, HistoryState } from '../index';

const { createPursesTerm } = require('rchain-token');


const uploadBagData = function*(action: {
  type: string;
  payload: { folder: Folder; bagId: string; description: string, mainFileResolution: string, recipient: string; price: number, mainFile: string };
}) {
  console.log('upload-bag-data', action.payload);
  let recipient = action.payload.recipient;
  const folder = action.payload.folder;
  const newBagId = action.payload.bagId;
  const state: HistoryState = store.getState();

  const publicKey = state.reducer.publicKey;
  const privateKey = yield getPrivateKey(state);

  const did = new DID({
    resolver: { ...(yield getRchainResolver()), ...KeyResolver.getResolver() },
  });
  const authSecret = Buffer.from(privateKey, 'hex');
  const provider = new Secp256k1Provider(authSecret);

  yield did.authenticate({ provider: provider });

  let recipientDid;
  if (recipient) {
    recipientDid = 'did:rchain:' + state.reducer.registryUri + "/" + recipient;
  } else {
    recipientDid = 'did:rchain:' + state.reducer.registryUri + "/" + state.reducer.user;
  }


  const fileDocument = {
    files: folder.files,
    signatures: folder.signatures,
    date: folder.date,
    description: action.payload.description,
    resolution: action.payload.mainFileResolution,
    scheme: {
      '0': recipientDid,
      '1': 'did:rchain:' + state.reducer.registryUri + "/" + state.reducer.user
    },
    mainFile: action.payload.mainFile || Object.keys(folder.files)[0]
  } as Folder;


  const { jws, linkedBlock } = yield did.createDagJWS(fileDocument);
  
  const jwe = yield did.createDagJWE(
    { jws: jws, data: encodeBase64(linkedBlock) },
    [recipientDid],
    {
      protectedHeader: {
        alg: 'A256GCMKW',
      },
    }
  );
  
  const stringifiedJws = JSON.stringify(jwe, replacer);
  const deflatedJws = deflate(stringifiedJws);
  const gzipped = Buffer.from(deflatedJws).toString('base64');

  const payload = {
    purses: {
      [newBagId]: {
        id: newBagId,
        boxId: recipient,
        type: '0',
        quantity: 1,
        price: null,
      }
    },
    data: {
      [newBagId]: gzipped
    },
    masterRegistryUri: state.reducer.registryUri,
    contractId: "store",
    boxId: state.reducer.user,
  };

  localStorage.setItem('price', JSON.stringify(action.payload.price));

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
  

  try {
    const deployResponse = yield rchainToolkit.http.deploy(state.reducer.validatorUrl, deployOptions);
    if (!deployResponse.startsWith('"Success!')) {
      console.log(deployResponse);
    }
  }
  catch(err) {
    console.info("Unable to deploy");
    console.error(err);
  }
  
  yield put({
    type: 'PURCHASE_BAG_COMPLETED',
    payload: {},
  });

  Swal.fire({
    text: 'Upload is in progress',
    showConfirmButton: false,
    timer: 15000,
  });


  console.log(state);
 function notify() {
        Swal.fire({
            title: 'Success!',
            text: 'Upload complete',
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

export const uploadBagDataSaga = function*() {
  yield takeEvery('UPLOAD', uploadBagData);
};
