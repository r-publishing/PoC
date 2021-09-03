import { put, takeEvery } from 'redux-saga/effects';
import * as rchainToolkit from 'rchain-toolkit';
import { deflate } from 'pako';
import { v4 } from 'uuid';
import Swal from 'sweetalert2';

import KeyResolver from 'key-did-resolver';
import { getResolver as getRchainResolver } from 'rchain-did-resolver';
import { Secp256k1Provider } from 'key-did-provider-secp256k1';
import { DID } from 'dids';
import { parse } from 'did-resolver';
import { encodeBase64 } from 'dids/lib/utils';

import { Document, store, getBagsData } from '../';
import replacer from '../../utils/replacer';
import { getPrivateKey, HistoryState } from '../index';

const { purchaseTokensTerm } = require('rchain-token-files');

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

  const document =
    bagsData[`${action.payload.registryUri}/${action.payload.bagId}`];
  if (!document) {
    console.error('bagData/document not found');
    return;
  }

  let i = '0';
  let newBagId = action.payload.bagId;
  if (!document.signatures['0']) {
  } else if (!document.signatures['1']) {
    i = '1';
    newBagId = `${action.payload.bagId} ${parseInt(i, 10) + 1}`;
  } else if (!document.signatures['2']) {
    i = '2';
    newBagId = `${action.payload.bagId.slice(
      0,
      action.payload.bagId.length - 1
    )} ${parseInt(i, 10) + 1}`;
  } else {
    console.error('Signature 0, 1 and 2 are already on document');
    return;
  }

  const signedDocument = {
    ...document,
    data: Buffer.from(document.data, 'utf-8').toString('base64'),
    date: document.date,
    //parent: "did:rchain:" + addressFromBagId(action.payload.registryUri, action.payload.bagId),
  };

  const fileDocument = {
    ...signedDocument,
  } as Document;

  let recipient;
  if (fileDocument.scheme) {
    recipient = fileDocument.scheme[parseInt(i) % 3];
  } else {
    recipient = 'did:rchain:' + state.reducer.registryUri;
  }

  const parsedDid = parse(recipient);
  const addr = parsedDid.id;

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
    publicKey: publicKey,
    newBagId: newBagId,
    bagId: '0',
    quantity: 1,
    price: 1,
    bagNonce: v4().replace(/-/g, ''),
    data: gzipped,
  };

  did.deauthenticate();

  const term = purchaseTokensTerm(addr as string, payload);

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
    title: 'Success!',
    text: 'document upload successful',
    showConfirmButton: false,
    timer: 2500,
  });
  window.location.reload();
  return true;
};

export const reuploadBagDataSaga = function*() {
  yield takeEvery('REUPLOAD_BAG_DATA', reuploadBagData);
};
