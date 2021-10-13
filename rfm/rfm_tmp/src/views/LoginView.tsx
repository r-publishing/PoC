import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import * as rchainToolkit from 'rchain-toolkit';
import React, { useEffect /*, useState, Suspense, useEffect */ } from 'react';
//import { useHistory } from 'react-router';
//import { Link } from 'react-router-dom';

import {
  IonContent,
  //IonItem,
  //IonInput,
  //IonLabel,
  IonButton,
  IonSlides,
  IonSlide,
  //IonGrid,
  //IonRow,
  //IonCol,
  //IonToggle,
  //IonLoading,
} from '@ionic/react';
import './LoginView.scoped.css';
import { HistoryState, getPlatform } from '../store';
//import { Users } from '../users/users';
import { useTour } from '@reactour/tour';

// configure the tour
const publishSteps = [
  {
    selector: '.attestation-step-start',
    content: 'Login as Publisher to upload a photo.',
  },
  {
    selector: '.attestation-step-attest',
    content: 'Login as Attestor and attest the photo.',
  },
  {
    selector: '.attestation-step-start',
    content: 'Log back in as Publisher and push the NFT to marketplace.',
  },
  {
    selector: '.attestation-step-alice-marketplace',
    content: 'Browse the public marketplace as Alice and purchase something.',
  },
  {
    selector: '.attestation-step-alice-inventory',
    content: 'Alice can always find her purchased items in her personal inventory.',
  },
  {
    selector: '.attestation-step-bob-marketplace',
    content: "Alice has put her NFT for sale. Go back to marketplace and find the NFT there once again.",
  },
  {
    selector: '.attestation-step-bob-inventory',
    content: "The NFT has now traded hands from Alice to Bob and should be available in Bob's personal inventory.",
  },
  // ...
]

interface Demo {
  id: string;
  masterRegistryUri: string;
  publisherPrivKey: string;
  attestorPrivKey: string;
  alicePrivKey: string;
  bobPrivKey: string;
}


interface LoginViewProps {
  platform: string;
  action: string;
  init: (a: {
    registryUri: string;
    privateKey: string;
    platform: string;
    user: string;
    store: string;
  }) => void;
  demo: Demo | undefined;
}

const LoginViewComponent: React.FC<LoginViewProps> = props => {
  const { setIsOpen, setCurrentStep, setSteps, currentStep } = useTour();

  useEffect(() => {
    if (!localStorage.getItem('tour')) {
      localStorage.setItem('tour', currentStep.toString());
    }
    const menuTourStep = parseInt(localStorage.getItem('tour') || '0');
    setSteps(publishSteps);
    setTimeout(() => {
      setCurrentStep(menuTourStep);
      //setCurrentStep(0);
      setIsOpen(true);
    }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePublisherLogin = async() => {
    //localStorage.removeItem('user');
    localStorage.setItem('user', 'publisher');
    localStorage.setItem('publisher', 'true');
    
    props.init({
      registryUri: props.demo?.masterRegistryUri || '',
      privateKey:
        props.demo?.publisherPrivKey || '',
      platform: props.platform,
      user: 'publisher',
      store: "store"
    });
  }

  const handleAttestorLogin = async () => {
    //localStorage.removeItem('user');
    localStorage.removeItem('publisher');
    localStorage.setItem('user', 'attestor');

    props.init({
      registryUri: props.demo?.masterRegistryUri || '',
      privateKey: props.demo?.attestorPrivKey || '',
      platform: props.platform,
      user: 'attestor',
      store: "store"
    });
  };

  const handleStoreLoginAsAlice = async () => {
    localStorage.setItem('user', 'buyer');
    localStorage.removeItem('wallet');

    props.init({
      registryUri: props.demo?.masterRegistryUri || '',
      privateKey: props.demo?.alicePrivKey || '',
      platform: props.platform,
      user: 'publisher',
      store: "public_store"
    });
  }

   const handleStoreLoginAsBob = async () => {
     localStorage.setItem('user', 'buyer2');
     //localStorage.setItem('wallet', 'true');
     localStorage.removeItem('wallet');

     props.init({
       registryUri: props.demo?.masterRegistryUri || '',
       privateKey: props.demo?.bobPrivKey || '',
       platform: props.platform,
       user: 'buyer', //TODO: see all
       store: "public_store"
     });
   };

   const handleUserLoginAsAlice = async () => {
    localStorage.setItem('user', 'buyer');
    localStorage.setItem('wallet', 'true');

    props.init({
      registryUri: props.demo?.masterRegistryUri || '',
      privateKey: props.demo?.alicePrivKey || '',
      platform: props.platform,
      user: 'buyer',
      store: "public_store"
    });
  };

  const handleUserLoginAsBob = async () => {
    localStorage.setItem('user', 'buyer2');
    localStorage.setItem('wallet', 'true');

    props.init({
      registryUri: props.demo?.masterRegistryUri || '',
      privateKey: props.demo?.bobPrivKey || '',
      platform: props.platform,
      user: 'buyer2',
      store: "public_store"
    });
  };

  return (
    <IonContent>
      <IonSlides>
        <IonSlide>
          <React.Fragment>
            <div className="login">
              <h2>What would you like to do?</h2>

              <div className="container">
                {/* Publisher */}
                <div className="LoadButtonDiv">
                  <IonButton
                    onClick={async () => {
                      handlePublisherLogin();
                    }}
                    className="attestation-step-start"
                  >
                    Publish
                  </IonButton>
                </div>
                {/* Attestor */}
                <div className="LoadButtonDiv">
                  <IonButton
                    onClick={async () => {
                      handleAttestorLogin();
                    }}
                    className="attestation-step-attest"
                  >
                    Attest
                  </IonButton>
                </div>
                {/* Reseller */}
                <div className="LoadButtonDiv">
                  <IonButton
                    onClick={async () => {
                      handleStoreLoginAsAlice();
                    }}
                    className="attestation-step-alice-marketplace"
                  >
                    Marketplace (as Alice)
                  </IonButton>
                </div>
                {/* Reseller */}
                <div className="LoadButtonDiv">
                  <IonButton
                    onClick={async () => {
                      handleStoreLoginAsBob();
                    }}
                    className="attestation-step-bob-marketplace"
                  >
                    Marketplace (as Bob)
                  </IonButton>
                </div>
                {/* wallet*/}
                <div className="LoadButtonDiv">
                  <IonButton
                    onClick={async () => {
                      handleUserLoginAsAlice();
                    }}
                    className="attestation-step-alice-inventory"
                  >
                    Alice's NFTs
                  </IonButton>
                </div>
                {/* wallet*/}
                <div className="LoadButtonDiv">
                  <IonButton
                    onClick={async () => {
                      handleUserLoginAsBob();
                    }}
                    className="attestation-step-bob-inventory"
                  >
                    Bob's NFTs
                  </IonButton>
                </div>
              </div>
            </div>
          </React.Fragment>
        </IonSlide>
      </IonSlides>
    </IonContent>
  );
};
export const LoginView = connect(
  (state: HistoryState) => {
    return {
      platform: getPlatform(state),
    };
  },
  (dispatch: Dispatch) => {
    return {
      init: (a: {
        registryUri: string;
        privateKey: string;
        platform: string;
        user: string;
        store: string;
      }) => {
        dispatch({
          type: 'INIT',
          payload: {
            platform: a.platform,
            authorised: true,
            privateKey: a.privateKey,
            publicKey: rchainToolkit.utils.publicKeyFromPrivateKey(
              a.privateKey as string
            ),
            registryUri: a.registryUri,
            user: a.user,
            store: a.store
          },
        });
      },
    };
  },
  
)(LoginViewComponent);

export default LoginView;
