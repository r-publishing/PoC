import { put, takeEvery } from 'redux-saga/effects';
import * as rchainToolkit from 'rchain-toolkit';
import { deflate } from 'pako';
import Swal from 'sweetalert2';

import KeyResolver from 'key-did-resolver';
import { getResolver as getRchainResolver } from 'rchain-did-resolver';
import { Secp256k1Provider } from 'key-did-provider-secp256k1';
import { DID } from 'dids';
import { parse } from 'did-resolver';
import { encodeBase64 } from 'dids/lib/utils';

import { Folder, store, getBagsData } from '../';
import replacer from '../../utils/replacer';
import prepareDeploy from '../../utils/prepareDeploy';
import waitForUnforgeable from '../../utils/waitForUnforgeable';
//import validAfterBlockNumber from '../../utils/validAfterBlockNumber';
import { getPrivateKey, HistoryState } from '../index';

const { purchaseAndWithdrawTerm } = require('rchain-token');

function notify() {
  Swal.fire({
      title: 'Success!',
      text: 'Attestation complete',
      showConfirmButton: false,
      timer: 5000,
      didClose: () => {
        localStorage.setItem('tour', '2');
        window.location.reload();
      }
  })
}

const reuploadBagData = function*(action: {
  type: string;
  payload: { bagId: string; registryUri: string };
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

  let i = '0';
  let suffix = 'nft'
  let newBagId = action.payload.bagId;
  if (!folder.signatures['0']) {
  } else if (!folder.signatures['1']) {
    i = '1';
    newBagId = `${action.payload.bagId} ${parseInt(i, 10) + 1}`;
  } else if (!folder.signatures['2']) {
    i = '2';
    newBagId = `${action.payload.bagId.slice(
      0,
      action.payload.bagId.length - 1
    )} ${suffix}`;
  } else {
    console.error('Signature 0, 1 and 2 are already on document');
    return;
  }

  const signedDocument = {
    ...folder,
    date: folder.date,
  };

  const fileDocument = {
    ...signedDocument,
  } as Folder;

  let recipient = "";
  if (fileDocument.scheme) {
    recipient = fileDocument.scheme[parseInt(i) % 3];
  }

  let toBoxId;
  if (recipient) {
    const parsedDid = parse(recipient);
    toBoxId = parsedDid.path?.substring(1);
  }
  
  const { jws, linkedBlock } = yield did.createDagJWS(fileDocument);
  const jwe = yield did.createDagJWE(
    { jws: jws, data: encodeBase64(linkedBlock) },
    [recipient],
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
      masterRegistryUri: action.payload.registryUri,
      purseId: '0',
      contractId: `store`,
      boxId: state.reducer.user,
      toBoxId: toBoxId,
      quantity: 1,
      withdrawQuantity: 1,
      data: gzipped,
      newId: newBagId,
      merge: true,
      price: 1,
      publicKey: publicKey,
    }

  did.deauthenticate();
  
  const term = purchaseAndWithdrawTerm(payload);
  
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
  //const vab = yield validAfterBlockNumber(state.reducer.readOnlyUrl);
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
      text: 'Attestation is in progress',
      showConfirmButton: false
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

export const reuploadBagDataSaga = function*() {
  yield takeEvery('REUPLOAD_BAG_DATA', reuploadBagData);
};
