import { put, takeEvery } from 'redux-saga/effects';
import * as rchainToolkit from 'rchain-toolkit';
import { deflate } from 'pako';
import { v4 } from 'uuid';
import Swal from 'sweetalert2';

import KeyResolver from 'key-did-resolver';
import { getResolver as getRchainResolver } from 'rchain-did-resolver';
import { Secp256k1Provider } from 'key-did-provider-secp256k1';
import { DID } from 'dids';
import { encodeBase64 } from 'dids/lib/utils';
import { parse } from 'did-resolver';

import { Document, store } from '../';
import replacer from '../../utils/replacer';
import { getPrivateKey, HistoryState } from '../index';

const { purchaseTokensTerm } = require('rchain-token-files');

const uploadBagData = function*(action: {
  type: string;
  payload: { document: Document; bagId: string; recipient: string; price: number };
}) {
  console.log('upload-bag-data', action.payload);
  let repipient = action.payload.recipient;
  const document = action.payload.document;
  const state: HistoryState = store.getState();

  const publicKey = state.reducer.publicKey;
  const privateKey = yield getPrivateKey(state);

  const did = new DID({
    resolver: { ...(yield getRchainResolver()), ...KeyResolver.getResolver() },
  });
  const authSecret = Buffer.from(privateKey, 'hex');
  const provider = new Secp256k1Provider(authSecret);

  yield did.authenticate({ provider: provider });

  if (!repipient) {
    repipient = 'did:rchain:' + state.reducer.registryUri;
  }

  const fileDocument = {
    mimeType: document.mimeType,
    name: document.name,
    data: document.data,
    signatures: document.signatures,
    date: document.date,
    scheme: {
      '0': repipient,
      '1': 'did:rchain:' + state.reducer.registryUri,
    },
  } as Document;

  const { jws, linkedBlock } = yield did.createDagJWS(fileDocument);
  const jwe = yield did.createDagJWE(
    { jws: jws, data: encodeBase64(linkedBlock) },
    [repipient],
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
    newBagId: action.payload.bagId,
    bagId: '0',
    quantity: 1,
    price: action.payload.price,
    bagNonce: v4().replace(/-/g, ''),
    data: gzipped,
  };

  did.deauthenticate();

  const parsedDid = parse(repipient);
  const addr = parsedDid.id;
  const term = purchaseTokensTerm(addr, payload);

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

  console.log(state);
  Swal.fire({
    title: 'Success!',
    text: 'document upload successful',
    showConfirmButton: false,
    timer: 2500,
  });
  window.location.reload();
  return true;
};

export const uploadBagDataSaga = function*() {
  yield takeEvery('UPLOAD', uploadBagData);
};
