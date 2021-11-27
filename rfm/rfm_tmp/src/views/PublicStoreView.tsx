import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import React, { useEffect } from 'react';
import { useHistory } from 'react-router';

import {
  IonContent,
  //IonProgressBar,
  IonFab,
  IonFabButton,
  IonIcon,
} from '@ionic/react';
import { qrCode } from 'ionicons/icons';

import {
  getBags,
  getBagsData,
  getConnected,
  getDocumentsAddressesInOrder,
  getDocumentsAwaitingSignature,
  getDocumentsCompleted,
  State,
  HistoryState,
} from '../store';
import MarketItem from '../components/MarketItem';
import DummyBagItem from '../components/dummy/DummyBagItem';
import ModalDocument from '../components/ModalDocument';

import { parse } from 'did-resolver';
import './PublicStore.scoped.css';
import { useTour } from '@reactour/tour';

interface PublicDocumentView {
  connected: string;
  registryUri: string;
  action: 'show' | 'list';
  bagId?: string;
  isLoading: boolean;
  bags: State['bags'];
  bagsData: State['bagsData'];
  documentsAwaitingSignature: State['bagsData'];
  documentsAddressesInOrder: string[];
  documentsCompleted: State['bagsData'];
  searchText: string;
  platform: string;
  user: string;
}

const purchaseSteps = [
  { selector: '.MarketCard', content: 'The NFT is now for sale.' },
  { selector: '.PurchaseButton', content: 'Press the "Buy" button to purchase this NFT.' },
]

const purchasedSteps = [
  { selector: '.MarketCard', content: 'Congratulations! You now own this NFT!' },
  { selector: '.SellButton', content: 'You can put this item back to the store and resell it for a higher price.' },
]

const purchased2Steps = [
  { selector: '.MarketCard', content: 'Congratulations! You now own this NFT! This concludes our demo.' },
]

const PublicStoreComponent: React.FC<PublicDocumentView> = props => {
  const identity = localStorage.getItem('wallet');
  const history = useHistory();

  const { /* isOpen, currentStep, steps,*/ setIsOpen, setCurrentStep, setSteps } = useTour()
  useEffect(() => {
    if (props.user === "buyer") {
      if (localStorage.getItem('tour')) {
        const menuTourStep = parseInt(localStorage.getItem('tour') || '0');
        if (menuTourStep < 4) {
          setSteps(purchaseSteps);
        }
        else {
          setSteps(purchasedSteps);
        }
      }
    }

    if (props.user === "buyer2") {
      if (localStorage.getItem('tour')) {
        const menuTourStep = parseInt(localStorage.getItem('tour') || '0');
        if (menuTourStep < 6) {
          setSteps(purchaseSteps);
        }
        else {
          setSteps(purchased2Steps);
          localStorage.removeItem('demo');
          localStorage.setItem('tour', '0');
        }
      }
    }
    setTimeout(() => {
      setIsOpen(false);
      setCurrentStep(0);
      setIsOpen(true);
      setTimeout(() => {
        setCurrentStep(1);
      }, 6000)
    }, 100)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scanQRCode = () => {
    (window as any).cordova.plugins.barcodeScanner.scan(
      (result: any) => {
        try {
          const parsedDid = parse(result.text);
          const method = parsedDid.method;

          if (method === 'rchain') {
            let link = '/doc/show/' + parsedDid.id;
            if (parsedDid.path) {
              link = link + parsedDid.path;
            }
            history.push(link);
          }
        } catch (err) {
          console.info('not a DID. ' + err);

          const url = new URL(result.text);
          //TODO: check if link is also a valid hosted web app
          history.push(url.pathname + url.search);
        }
      },
      (err: string) => {
        console.error(err);
      },
      {
        showTorchButton: true,
        prompt: 'Scan document URL',
        formats: 'QR_CODE',
        resultDisplayDuration: 0,
      }
    );
  };

  if (props.action === 'show') {
    return (
      <IonContent>
        <ModalDocument
          registryUri={props.registryUri as string}
          bagId={props.bagId as string}
        />
      </IonContent>
    );
  }

  return (
    <div className="public-store">
      {identity ? (
        <div className="title">
          <h2>My NFTs</h2>
        </div>
      ) : (
        <div className="title">
          <h2>NFT Marketplace</h2>
        </div>
      )}
      <IonContent className="container">
        {props.platform !== 'web' && false ? (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton color="tertiary" onClick={scanQRCode}>
              <IonIcon icon={qrCode} />
            </IonFabButton>
          </IonFab>
        ) : (
          undefined
        )}
        {/*
        props.isLoading && props.action === "list"
        ? renderLoading()
        : undefined
        */}
        {props.action === 'list' ? (
          <>
            {!props.isLoading
              ? props.documentsAddressesInOrder.map(address => {
                return (
                    <div className="container">
                    <MarketItem
                      key={address}
                      registryUri={props.registryUri}
                      id={address}
                      bag={props.bags[address]}
                      folder={props.bagsData[address]}
                      onlyCompleted={false}
                      awaitsSignature={
                        !!props.documentsAwaitingSignature[address]
                      }
                      completed={!!props.documentsCompleted[address]}
                    />
                    </div>
                  );
                })
              : [...Array(10)].map((x, i) => (
                  <DummyBagItem key={i} id={i.toString()} />
                ))}
          </>
        ) : (
          undefined
        )}
      </IonContent>
    </div>
  );
};

export const PublicStore = connect(
  (state: HistoryState) => {
    return {
      connected: getConnected(state),
      bags: getBags(state),
      bagsData: getBagsData(state),
      documentsCompleted: getDocumentsCompleted(state),
      documentsAwaitingSignature: getDocumentsAwaitingSignature(state),
      documentsAddressesInOrder: getDocumentsAddressesInOrder(state),
      isLoading: state.reducer.isLoading,
      searchText: state.reducer.searchText,
      platform: state.reducer.platform,
      user: state.reducer.user,
    };
  },
  (dispatch: Dispatch) => {
    return {};
  }
)(PublicStoreComponent);

export default PublicStore;
