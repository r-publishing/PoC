import { createStore, applyMiddleware, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';
import { createSelector } from 'reselect';

import { sagas } from './sagas/';
import { connectRouter } from 'connected-react-router';
import { routerMiddleware } from 'connected-react-router/immutable';
import { createBrowserHistory, History } from 'history'

import { CombinedState } from 'redux';
import { RouterState } from 'connected-react-router';

import {
  FingerprintAIO,
  //FingerprintOptions
} from "@ionic-native/fingerprint-aio/";

import { DID, JWSSignature } from 'dids';

import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";

export interface State {
  did: undefined | DID;
  readOnlyUrl: string;
  validatorUrl: string;

  // rchain-token contract
  contractPublicKey: undefined | string;
  identities: { [pubKey: string]: string }; //Map of identities <pubkey, regUri>
  registryUri: undefined | string;

  publicKey: undefined | string;

  // rchain-token bags and data
  bags: { [address: string]: Bag };
  bagsData: { [address: string]: Folder };

  isLoading: boolean;
  searchText: string;
  platform: string;

  authorised: boolean;
  user: string;
}

export type HistoryState = CombinedState<{
  router: RouterState<unknown>;
  reducer: State; 
}>

export interface Bag {
  n: string;
  quantity: number;
  price: undefined | number;
  publicKey: string;
}
export interface Signature extends JWSSignature {
  payload: string;
  publicKey: string;
}

export interface Folder {
  files: { [s: string]: Document },
  signatures: { [s: string]: Signature };
  scheme?: { [s: string]: string },
  date: string;
  mainFile: string;
}

export interface Document {
  name: string;
  mimeType: string;
  data: string;
  //parent?: string;
}

const initialState: State = {
  did: undefined,
  readOnlyUrl: 'https://gracious-pare-6c4c99.netlify.app',
  validatorUrl: 'https://gracious-pare-6c4c99.netlify.app',
  contractPublicKey: undefined,
  identities: {},
  registryUri: undefined,
  publicKey: undefined,
  bags: {},
  bagsData: {},
  isLoading: false,
  searchText: '',
  platform: '',
  authorised: false,
  user: '',
};

const reducer = (
  state = initialState,
  action: { type: string; payload: any }
): State => {
  console.log(action);
  switch (action.type) {
    case 'INIT': {
      return {
        ...state,
      };
    }
    case 'AUTHORISED': {
      return {
        ...state,
        did: action.payload.did,
        authorised: true,
        registryUri: action.payload.registryUri,
        publicKey: action.payload.publicKey,
        user: action.payload.user
      };
    }
    case "ADD_IDENTITY": {
      return {
        ...state,
        identities: {
          ...state.identities,
          [action.payload.pubKey]: action.payload.registryUri
        }
      };
    }
    case "INIT_COMPLETED": {
      return {
        ...state,
        contractPublicKey: action.payload.contractPublicKey,
      };
    }
    case 'SET_LOADING': {
      return {
        ...state,
        isLoading: action.payload,
      };
    }
    case 'SAVE_BAGS_COMPLETED': {
      return {
        ...state,
        bags: action.payload,
      };
    }
    case 'SAVE_BAG_DATA_COMPLETED': {
      return {
        ...state,
        bagsData: {
          ...state.bagsData,
          [action.payload.bagId]: action
            .payload.document,
        },
      };
    }
    case 'SAVE_BAGS_DATA_COMPLETED': {
      return {
        ...state,
        bagsData: action.payload,
      };
    }

    case 'SET_PLATFORM': {
      return {
        ...state,
        platform: action.payload.platform,
      };
    }
    case 'SET_USER': {
      return {
        ...state,
        user: action.payload.user,
      }
    }
    case 'SET_SEARCH_TEXT': {
      return {
        ...state,
        searchText: action.payload.searchText,
      };
    }
    default: {
      return state;
    }
  }
};

const sagaMiddleware = createSagaMiddleware();
export const history = createBrowserHistory()

let middlewares = [routerMiddleware(history), sagaMiddleware];

const sagasFunction = function* rootSaga() {
  try {
    yield all([sagas()]);
  } catch (err) {
    console.error('An error occured in sagas');
    console.log(err);
  }
};

const createRootReducer = (history: History) => combineReducers({
  router: connectRouter(history),
  reducer
})

export const store = createStore(createRootReducer(history), applyMiddleware(...middlewares));

sagaMiddleware.run(sagasFunction);

export interface AccountStorage {
  registryUri: string,
  privateKey: string
}
export const getPublicKey = createSelector(
  (state: HistoryState) => state,
  (state: HistoryState) => state.reducer.publicKey
);
export const getPlatform = createSelector(
  (state: HistoryState) => state,
  (state: HistoryState) => state.reducer.platform
);
export const getPrivateKey = createSelector(
  getPublicKey,
  getPlatform,
  (publicKey: HistoryState['reducer']['publicKey'], platform: HistoryState['reducer']['platform']) => {
    return new Promise<string>(async (resolve, reject) => {
      if (["ios", "android"].includes(platform)) {
        FingerprintAIO.isAvailable()
        .then(available => {
          FingerprintAIO.loadBiometricSecret({
            description: "Allow the app to access your PrivateKey?",
            disableBackup: true, // always disabled on Android
          }).then(privateKey => {
            resolve(privateKey)
          })
        })
        .catch(err => {
          console.info(
            "Biometrics not available. Reason: " + JSON.stringify(err)
          );
          reject(err)
        });
      }
      else {
        const info = await SecureStoragePlugin.get({ key: publicKey as string })
        const parsedInfo = JSON.parse(info.value) as AccountStorage;
        resolve(parsedInfo.privateKey);
      }
    });
  }
);
export const getBags = createSelector(
  (state: HistoryState) => state,
  (state: HistoryState) => state.reducer.bags
);
export const getBagsData = createSelector(
  (state: HistoryState) => state,
  (state: HistoryState) => state.reducer.bagsData
);
export const getConnected = createSelector(
  (state: HistoryState) => state,
  (state: HistoryState): 'owner' | 'guest' => state.reducer.contractPublicKey === state.reducer.publicKey ? "owner" : "guest"
);

export const getDocumentsCompleted = createSelector(
  (state: HistoryState) => state,
  (state: HistoryState) => {
    const bagsData = state.reducer.bagsData;
    const documentsComplete: { [bagId: string]: Folder } = {};
    Object.keys(bagsData).forEach(bagId => {
      const folder = bagsData[bagId];
      if (
        folder && folder.signatures && 
        folder.signatures['0'] &&
        folder.signatures['1']
      ) {
        documentsComplete[bagId] = folder;
        return;
      }
    });

    return documentsComplete;
  }
);

export const getDocumentsAddressesInOrder = createSelector(
  getBagsData,
  (bagsData: HistoryState['reducer']['bagsData']) => {
    const addresses = Object.keys(bagsData).sort((a, b) => {
      if (bagsData[a].date === bagsData[b].date) {
        return 1;
      } else {
        return bagsData[a].date > bagsData[b].date ? 1 : -1
      }
    })

    return addresses;
  }
);

export const getDocumentsAwaitingSignature = createSelector(
  getBagsData,
  getPublicKey,
  (bagsData: HistoryState['reducer']['bagsData'], publicKey: HistoryState['reducer']['publicKey']) => {
    const documentsAwaitingSignature: { [bagId: string]: Folder } = {};
    Object.keys(bagsData).forEach(bagId => {
      const folder = bagsData[bagId];

      if (
        folder && folder.signatures &&
        folder.signatures['0'] &&
        !folder.signatures['1'] &&
        folder.signatures['0'].publicKey !== publicKey
      ) {
        documentsAwaitingSignature[bagId] = folder;
        return;
      }
    });

    return documentsAwaitingSignature;
  }
);
