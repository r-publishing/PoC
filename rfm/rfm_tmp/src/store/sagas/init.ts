import { takeEvery, put } from 'redux-saga/effects';
import * as rchainToolkit from 'rchain-toolkit';
import {CombinedState} from 'redux';

import { store, State, Bag, AccountStorage, Folder, Signature } from '..';
import { addressFromPurseId } from '../../utils/addressFromPurseId';
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

import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";

const {
  readPursesTerm,
  readBoxTerm,
  readPursesDataTerm,
  //readConfigTerm
} = require("rchain-token")

const load = function* (action: { type: string; payload: any}) {
  const state : CombinedState<{ router: RouterState<unknown>; reducer: State; }> = store.getState();
  yield put(
    {
      type: "SET_LOADING",
      payload: true
    }
  );

  const pubKey = action.payload.publicKey;
  const registryUri = action.payload.registryUri;
  const user = action.payload.user;
  const storeStr = action.payload.store;


  const term2 = readBoxTerm({ boxId: user, masterRegistryUri: registryUri });
  const readBoxResult = yield rchainToolkit.http.exploreDeploy(
    state.reducer.readOnlyUrl,
    {
      term: term2
    }
  )
  const box = rchainToolkit.utils.rhoValToJs(JSON.parse(readBoxResult).expr[0]);

  const pursesIds = Object.keys(box.purses).length > 0 ? box.purses[storeStr] : [];
  const term1 = readPursesTerm({
    masterRegistryUri: registryUri,
    contractId: storeStr,
    pursesIds: pursesIds || [],
  });

  const readAllPursesResult = yield rchainToolkit.http.exploreDeploy(
    state.reducer.readOnlyUrl,
    {
      term: term1
    }
  )

    const expr = JSON.parse(readAllPursesResult).expr;
  const boxData = rchainToolkit.utils.rhoValToJs(expr ? expr[0] : {});

  const purses =  boxData;
  const pursesKeys = Object.keys(purses || {});
  let readPursesDataResult;
  if (pursesKeys.length > 0) {
    const term3 = readPursesDataTerm(
    {
      masterRegistryUri: registryUri,
      pursesIds: pursesKeys,
      contractId: storeStr,
    });
    readPursesDataResult = yield rchainToolkit.http.exploreDeploy(
      state.reducer.readOnlyUrl,
      {
        term: term3
      }
    )
  }

  const rchainTokenValues = rchainToolkit.utils.rhoValToJs(JSON.parse(readBoxResult).expr[0])
  
  if (["ios", "android"].includes(state.reducer.platform)) {
    const available = yield FingerprintAIO.isAvailable();
    if (available) {
      yield FingerprintAIO.registerBiometricSecret({
        description: "Register this private key?",
        secret: action.payload.privateKey,
        invalidateOnEnrollment: false,
        disableBackup: true, // always disabled on Android
      })
    }
  }
  else {
    const record = { key: pubKey, value: JSON.stringify({
      registryUri: action.payload.registryUri,
      privateKey: action.payload.privateKey
      } as AccountStorage)
     }
    SecureStoragePlugin.set(record)
  }

  const did = new DID({ resolver: { ...yield getRchainResolver(), ...KeyResolver.getResolver() } })
  const authSecret = Buffer.from(action.payload.privateKey, 'hex');
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
          user: user
        }
      }
    );
  }
  
  yield put(
    {
      type: "INIT_COMPLETED",
      payload: {
        contractPublicKey: rchainTokenValues.publicKey,
      }
    }
  );

  const expr2 = JSON.parse(readAllPursesResult).expr;
  const bags = rchainToolkit.utils.rhoValToJs(expr2 ? expr2[0] : {}) || {};
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
  
  let bagsData = Object();
  if (readPursesDataResult) {
  bagsData = rchainToolkit.utils.rhoValToJs(JSON.parse(readPursesDataResult).expr[0]);

  const newBagsData: { [address: string]: Folder } = {};


  Object.keys(bagsData).forEach(async bagId => {
    const dataAtNameBuffer = Buffer.from(decodeURI(bagsData[bagId]), 'base64');
    const unzippedBuffer = Buffer.from(inflate(dataAtNameBuffer));
    const fileAsString = unzippedBuffer.toString("utf-8");
    
    let dagJwsObj : DagJWS;
    let dagJwsData : string;
    if (storeStr === "store") {
      const jwe = JSON.parse(fileAsString) as JWE;
      let jws;
      try {
        jws = await did.decryptDagJWE(jwe);
      } catch(err) {
        console.info("Unable to decrypt. " + err);
        return;
      }
      dagJwsObj = jws?.jws;
      dagJwsData = jws?.data
    } else {
      const jws = JSON.parse(fileAsString);
      dagJwsObj = jws?.jws;
      dagJwsData = jws?.data;
    }
    
    if (dagJwsObj && dagJwsData) {
      try {
        const verified = await did.verifyJWS(dagJwsObj);

        const resolved = await did.resolve(verified.kid);
        const publicKey = resolved.publicKey[0].publicKeyHex;

        const fileAsJson = dagCBOR.util.deserialize(decodeBase64(dagJwsData)) as Folder;

        const signature = {
          ...dagJwsObj.signatures[0],
          payload: dagJwsObj.payload,
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
  yield put(
    {
      type: "SAVE_BAGS_DATA_COMPLETED",
      payload: newBagsData
    }
  );
  console.log("this is init", newBagsData)

  }
  
  did.deauthenticate();
  

  yield put(
    {
      type: "SET_LOADING",
      payload: false
    }
  );

  store.dispatch(push('/doc'))

  return true;
};

export const initSaga = function* () {
  yield takeEvery("INIT", load);
};
