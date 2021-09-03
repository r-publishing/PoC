import { takeEvery, put } from 'redux-saga/effects';

import { addressFromBagId } from '../../utils/addressFromBagId';
import { store, State, Document, getPrivateKey } from '../../store/';

import { CombinedState } from 'redux';
import { RouterState } from 'connected-react-router';

import KeyResolver from 'key-did-resolver';
import { getResolver as getRchainResolver } from 'rchain-did-resolver';
import { Secp256k1Provider } from 'key-did-provider-secp256k1';
import { DID, DagJWS } from 'dids';
import { decodeBase64 } from 'dids/lib/utils';
import dagCBOR from 'ipld-dag-cbor';
const { readBagOrTokenDataTerm } = require('rchain-token-files');

const loadBagData = function*(action: { type: string; payload: any }) {
  console.log('load-bag-data', action.payload);
  const state: CombinedState<{
    router: RouterState<unknown>;
    reducer: State;
  }> = store.getState();
  const docAddr = addressFromBagId(
    action.payload.registryUri,
    action.payload.bagId
  );

  if (state.reducer.bagsData[docAddr]) {
    yield put({
      type: 'SET_LOADING_BAG',
      payload: false,
    });
    return true;
  }

  yield put({
    type: 'SET_LOADING_BAG_DATA',
    payload: true,
  });

  const privateKey = yield getPrivateKey(state);
  const did = new DID({
    resolver: { ...(yield getRchainResolver()), ...KeyResolver.getResolver() },
  });
  const authSecret = Buffer.from(privateKey, 'hex');
  const provider = new Secp256k1Provider(authSecret);

  yield did.authenticate({ provider: provider });

  try {
    const jwe = yield did.resolve('did:rchain:' + docAddr);
    const jws = yield did.decryptDagJWE(jwe);
    if (jws.jws) {
      const verified = yield did.verifyJWS(jws.jws as DagJWS);
      console.info(verified);

      const fileAsJson = dagCBOR.util.deserialize(
        decodeBase64(jws.data)
      ) as Document;
      fileAsJson.data = Buffer.from(fileAsJson.data, 'base64').toString(
        'utf-8'
      );

      yield put({
        type: 'SAVE_BAG_DATA_COMPLETED',
        payload: {
          bagId: addressFromBagId(
            action.payload.registryUri,
            action.payload.bagId
          ),
          registryUri: action.payload.registryUri,
          document: fileAsJson,
        },
      });
    }
  } catch (err) {
    console.log(err);
    yield put({
      type: 'SAVE_BAG_DATA_COMPLETED',
      payload: {
        bagId: action.payload.bagId,
        registryUri: action.payload.registryUri,
        document: null,
      },
    });
  }

  did.deauthenticate();

  yield put({
    type: 'SET_LOADING_BAG',
    payload: false,
  });

  return true;
};

export const loadBagDataSaga = function*() {
  yield takeEvery('LOAD_BAG_DATA', loadBagData);
};
