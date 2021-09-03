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
  }) => void;
}
const LoginViewComponent: React.FC<LoginViewProps> = props => {

  const handlePublisherLogin = async() => {
    localStorage.removeItem('user');
  
    props.init({
      registryUri: Users.publisher.REGISTRY_URI,
      privateKey:
        Users.publisher.PRIVATE_KEY,
      platform: props.platform,
      user: 'publisher'
    });
  }

  const handleAttestorLogin = async () => {
    localStorage.removeItem('user');

    props.init({
      registryUri: Users.attestor.REGISTRY_URI,
      privateKey: Users.attestor.PRIVATE_KEY,
      platform: props.platform,
      user: 'attestor',
    });
  };

  const handleBuyerLogin = async () => {
    localStorage.setItem('user', 'buyer');

    props.init({
      registryUri: Users.publisher.REGISTRY_URI,
      privateKey: Users.publisher.PRIVATE_KEY,
      platform: props.platform,
      user: 'buyer'
    });
  }

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
                      handleBuyerLogin();
                    }}
                  >
                    Buy
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
        user: string
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
            user: a.user
          },
        });
      },
    };
  },
  
)(LoginViewComponent);

export default LoginView;
