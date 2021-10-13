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
import Horizontal from '../components/Horizontal';
import BagItem from '../components/BagItem';
import DummyBagItem from '../components/dummy/DummyBagItem';
import ModalDocument from '../components/ModalDocument';
import ModalUploadDocument from '../components/ModalUploadDocument';

import { parse } from 'did-resolver';
import { useTour } from '@reactour/tour';

/*
declare global {
  interface Window {
    cordova: {
      plugins: {
        barcodeScanner: {
          scan: (a: unknown, b: unknown, c: unknown) => unknown;
        };
      };
    };
  }
}
*/
/*
const renderLoading = () => {
  return <IonProgressBar color="secondary" type="indeterminate" />;
};

type TRouteParams = {
  uri: string; // since it route params
};
*/

const componentSteps = [
  { selector: '.attestation-step-upload-button', content: 'Upload a photo you wish to attest and publish.' },
  { selector: '.attested.pos_0', content: 'Our photo has been attested. Click on it to confirm both signatures are valid.' },
  { selector: '.attested.pos_0', content: 'Our photo has been attested. Click on it to confirm both signatures are valid.' },
]

const attestSteps = [
  { selector: '.not_attested.pos_0', content: 'Attestor received a photo to review. Attest it now by clicking on it.' },
  { selector: '.not_attested.pos_0', content: 'Attestor received a photo to review. Attest it now by clicking on it.' },
]

interface DockListViewProps {
  connected: string;
  registryUri: string;
  action: 'show' | 'list' | 'upload';
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


const DockListViewComponent: React.FC<DockListViewProps> = props => {
  const history = useHistory();


  const { /* isOpen, currentStep, steps,*/ setIsOpen, setCurrentStep, setSteps } = useTour()
  useEffect(() => {
    

    if (props.user === "publisher") {
      setSteps(componentSteps);
      if (localStorage.getItem('tour')) {
        const menuTourStep = parseInt(localStorage.getItem('tour') || '0');
        if (menuTourStep <= 2) {
          setTimeout(() => {
            setIsOpen(false);
            setCurrentStep(menuTourStep);
            setIsOpen(true);
          }, 100);
        }
        else {
          setIsOpen(false);
        }
      }
    }
    if (props.user === "attestor") {
      setSteps(attestSteps);
      setTimeout(() => {
        setIsOpen(false);
        setCurrentStep(0);
        setIsOpen(true);
      }, 100)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  //const identity = localStorage.getItem('publisher');

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

  if (props.action === 'upload') {
    return (
      <IonContent>
        <ModalUploadDocument />
      </IonContent>
    );
  }

  return (
    
    <IonContent>
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
      <Horizontal />
      {props.action === 'list' ? (
        <>
          {!props.isLoading
            ? props.documentsAddressesInOrder.map((address, index) => {
                return (
                  <BagItem
                    pos={index.toString()}
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
  );
};

export const DockListView = connect(
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
)(DockListViewComponent);

export default DockListView;
