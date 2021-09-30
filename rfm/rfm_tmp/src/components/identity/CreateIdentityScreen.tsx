import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router';

import {
  IonLabel,
  IonButton,
  IonSlide,
  IonGrid,
  IonRow,
  IonCol,
  IonChip
} from '@ionic/react';
import './IdentityScreen.scoped.css';

import { generateMnemonic,/* mnemonicToSeedSync, validateMnemonic*/ } from "bip39";
//import hdkey from "ethereumjs-wallet/dist/hdkey";
//import { bufferToHex, pubToAddress, toChecksumAddress } from "ethereumjs-util";


const CreateIdentityScreen: React.FC = (props) => {
  const [seed, setSeed] = useState(Array);
  const history = useHistory();

  useEffect(() => {
    const tmp = createSeed();
    console.info(tmp);
    setSeed(tmp);
  }, []);

  const createSeed = () => {
    return generateMnemonic().split(" ");
  }

  return (
    <IonSlide>
      <IonGrid>
        <IonRow>
          <IonCol>
            <IonLabel>Please write down your seed:</IonLabel>
          </IonCol>
        </IonRow>
        <IonRow>
          {seed.map(function (word, index) {
            return <IonChip key={index}>{index} : {word as String}</IonChip>;
          })}
        </IonRow>
        <IonRow>
          <IonCol>
            <IonButton color="none" className="ActionButton" onClick={() => {
              history.push('/user/new');
            }}>Next</IonButton>
          </IonCol>
        </IonRow>
      </IonGrid>
    </IonSlide>
  )
};

export default CreateIdentityScreen;
