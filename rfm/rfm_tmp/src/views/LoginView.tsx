import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import * as rchainToolkit from 'rchain-toolkit';
import React, { Suspense, useState, useEffect } from 'react';
import { useHistory } from 'react-router';
import { Link } from 'react-router-dom';
import {
  IonContent,
  IonItem,
  IonInput,
  IonLabel,
  IonButton,
  IonSlides,
  IonSlide,
  IonGrid,
  IonRow,
  IonCol,
  IonToggle,
  IonLoading,
} from '@ionic/react';
import './LoginView.scoped.css';
import { HistoryState, getPlatform } from '../store';
import { Users } from '../users/users';

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
}
const LoginViewComponent: React.FC<LoginViewProps> = props => {

  const handlePublisherLogin = async() => {
    //localStorage.removeItem('user');
    localStorage.setItem('user', 'publisher');
    localStorage.setItem('publisher', 'true')
  
    props.init({
      registryUri: Users.publisher.REGISTRY_URI,
      privateKey:
        Users.publisher.PRIVATE_KEY,
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
      registryUri: Users.attestor.REGISTRY_URI,
      privateKey: Users.attestor.PRIVATE_KEY,
      platform: props.platform,
      user: 'attestor',
      store: "store"
    });
  };

  const handleStoreLogin = async () => {
    localStorage.setItem('user', 'buyer');
    localStorage.removeItem('wallet');

    props.init({
      registryUri: Users.buyer.REGISTRY_URI,
      privateKey: Users.buyer.PRIVATE_KEY,
      platform: props.platform,
      user: 'publisher',
      store: "public_store"
    });
  }

   const handleUserLogin = async () => {
     localStorage.setItem('user', 'buyer');
     localStorage.setItem('wallet', 'true');

     props.init({
       registryUri: Users.buyer.REGISTRY_URI,
       privateKey: Users.buyer.PRIVATE_KEY,
       platform: props.platform,
       user: 'buyer',
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
                  >
                    Attest
                  </IonButton>
                </div>
                {/* Buyer */}
                <div className="LoadButtonDiv">
                  <IonButton
                    onClick={async () => {
                      handleStoreLogin();
                    }}
                  >
                    Marketplace
                  </IonButton>
                </div>
                {/* wallet*/}
                <div className="LoadButtonDiv">
                  <IonButton
                    onClick={async () => {
                      handleUserLogin();
                    }}
                  >
                    Owned NFTs
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
