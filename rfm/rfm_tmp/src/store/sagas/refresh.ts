import { takeEvery, put } from 'redux-saga/effects';
import * as rchainToolkit from 'rchain-toolkit';
import {CombinedState} from 'redux';

import { store, State, Bag, AccountStorage, Document, Signature, getPrivateKey } from '..';
//import { addressFromPurseId } from '../../utils/addressFromPurseId';
import { inflate } from 'pako';

import { push, RouterState } from 'connected-react-router';

import {
  FingerprintAIO
} from "@ionic-native/fingerprint-aio/";

import KeyResolver from 'key-did-resolver';
import { getResolver as getRchainResolver } from "rchain-did-resolver";
import { Secp256k1Provider } from 'key-did-provider-secp256k1';
import { DID, DagJWS } from 'dids';
import { decodeBase64 } from 'dids/lib/utils'
import dagCBOR from 'ipld-dag-cbor'
import { JWE } from 'did-jwt'
/*
const {
  readBagsTerm,
  readBagsOrTokensDataTerm,
  read,
} = require('rchain-token-files');
*/
const refresh = function* (action: { type: string; payload: any}) {
  const state : CombinedState<{ router: RouterState<unknown>; reducer: State; }> = store.getState();
  
  yield put(
    {
      type: "SET_LOADING",
      payload: true
    }
  );

  const privateKey: string = yield getPrivateKey(state);

  const pubKey = rchainToolkit.utils.publicKeyFromPrivateKey(
    privateKey as string
  )
/*
  const term1 = readBagsTerm(action.payload.registryUri);
  const ed1 = yield rchainToolkit.http.exploreDeploy(
    state.reducer.readOnlyUrl,
    {
      term: term1
    }
  )

  const term2 = read(action.payload.registryUri);
  const ed2 = yield rchainToolkit.http.exploreDeploy(
    state.reducer.readOnlyUrl,
    {
      term: term2
    }
  )
  const rchainTokenValues = rchainToolkit.utils.rhoValToJs(JSON.parse(ed2).expr[0])

  const term3 = readBagsOrTokensDataTerm(action.payload.registryUri, 'bags');
  const ed3 = yield rchainToolkit.http.exploreDeploy(
    state.reducer.readOnlyUrl,
    {
      term: term3
    }
  )
  */

  const did = new DID({ resolver: { ...yield getRchainResolver(), ...KeyResolver.getResolver() } })
  const authSecret = Buffer.from(privateKey, 'hex');
  const provider = new Secp256k1Provider(authSecret)

  yield did.authenticate({ provider: provider })

  if (did.authenticated) {
    yield put(
      {
        type: "AUTHORISED",
        payload: {
          did: did,
          authorised: true,
          registryUri: action.payload.registryUri,
          publicKey: pubKey,
        }
      }
    );
  }
  /*
  yield put(
    {
      type: "INIT_COMPLETED",
      payload: {
        //nonce: rchainTokenValues.nonce,
        contractPublicKey: rchainTokenValues.publicKey,
      }
    }
  );
  

  const bags = rchainToolkit.utils.rhoValToJs(JSON.parse(ed1).expr[0]);
  const newBags: { [address: string]: Bag } = {};
  Object.keys(bags).forEach(bagId => {
    newBags[addressFromPurseId(action.payload.registryUri as string, bagId)] = bags[bagId];
  });
  yield put(
    {
      type: "SAVE_BAGS_COMPLETED",
      payload: newBags,
    }
  );

  const bagsData = rchainToolkit.utils.rhoValToJs(JSON.parse(ed3).expr[0]);
  const newBagsData: { [address: string]: Document } = {};

  Object.keys(bagsData).forEach(async bagId => {
    const dataAtNameBuffer = Buffer.from(decodeURI(bagsData[bagId]), 'base64');
    const unzippedBuffer = Buffer.from(inflate(dataAtNameBuffer));
    const fileAsString = unzippedBuffer.toString("utf-8");

    const jwe = JSON.parse(fileAsString) as JWE;
    let jws;
    try {
      jws = await did.decryptDagJWE(jwe);
    } catch(err) {
      console.info("Unable to decrypt. " + err);
      return;
    }
    const dagJws: DagJWS = jws?.jws;
    if (dagJws) {
      try {
        const verified = await did.verifyJWS(dagJws);

        const resolved = await did.resolve(verified.kid);
        const publicKey = resolved.publicKey[0].publicKeyHex;

        const fileAsJson = dagCBOR.util.deserialize(decodeBase64(jws.data)) as Document;
        fileAsJson.data = Buffer.from(fileAsJson.data, 'base64').toString("utf-8");

        const signature = {
          ...dagJws.signatures[0],
          payload: dagJws.payload,
          publicKey: publicKey
        } as Signature;

        const signatureCount = Object.keys(fileAsJson.signatures).length;
        fileAsJson.signatures[signatureCount] = signature;
        
        newBagsData[addressFromPurseId(action.payload.registryUri as string, bagId)] = fileAsJson;
      }
      catch(err) {
        console.info("Unable to verify. " + err);
      }
      
    }

  });
  */

  did.deauthenticate();
  /*
  yield put(
    {
      type: "SAVE_BAGS_DATA_COMPLETED",
      payload: newBagsData
    }
  );
  */

  yield put(
    {
      type: "SET_LOADING",
      payload: false
    }
  );

  return true;
};

export const refreshSaga = function* () {
  yield takeEvery("REFRESH", refresh);
};
