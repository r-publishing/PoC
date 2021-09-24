import React, { useState } from 'react';
import * as rchainToolkit from 'rchain-toolkit';
import {
  IonLabel,
  IonButton,
  IonSlide,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import './IdentityScreen.scoped.css';

import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { HistoryState, store } from '../../store';
import QRCodeComponent from '../QRCodeComponent';
import { Users } from '../../users/users';
//import Avatar from '../../assets/avatar.jpg';

interface IdentityScreenComponentProps {
  registryUri: string | undefined;
  user: string | undefined;
  publicKey: string;
}
const IdentityScreenComponent: React.FC<IdentityScreenComponentProps> = (props) => {
  const [balance, setBalance] = useState<number>();
  const state: HistoryState = store.getState();

  const READ_ONLY_HOST = 'http://localhost:40403';
  const main = async () => {
    const term = `new return, rl(\`rho:registry:lookup\`), RevVaultCh, vaultCh, balanceCh in {
    rl!(\`rho:rchain:revVault\`, *RevVaultCh) |
    for (@(_, RevVault) <- RevVaultCh) {
      @RevVault!("findOrCreate", "${rchainToolkit.utils.revAddressFromPublicKey(props.publicKey)}", *vaultCh) |
      for (@(true, vault) <- vaultCh) {
        @vault!("balance", *balanceCh) |
        for (@balance <- balanceCh) { return!(balance) }
      }
    }
  }`;

    try {
      const result = await rchainToolkit.http.exploreDeploy(READ_ONLY_HOST, {
        term: term,
      });

      const data = rchainToolkit.utils.rhoValToJs(JSON.parse(result).expr[0]);
      const revBalance = data * (1 / 100000000);
      console.log(revBalance);
      setBalance(revBalance);
    } catch (e) {
      return "error";
    }
  }
  main();

  const shortenName = () => {
    return "did:rchain:" + props.registryUri?.substring(0, 6) + "..." + props.registryUri?.substring(48, 54)
  }

  const qrCodeContent = () => {
    return `did:rchain:${props.registryUri}/${props.user}`;
  }

  return (
    <IonSlide>
      <IonGrid>
        {/* (<img className="Avatar" src={Avatar} alt="Avatar" />) */}
        <QRCodeComponent
          url={qrCodeContent()}
        />
        <IonRow>
          <IonCol>
            <IonLabel>{props.user}</IonLabel>
          </IonCol>
        </IonRow>
        {/* <IonRow>
          <IonCol>
            {(props.registryUri ? <IonLabel>{shortenName()}</IonLabel> : undefined)}
          </IonCol>
        </IonRow> */}
        {/* <IonRow>
          <IonCol>
            <IonButton color="primary">Backup Identity</IonButton>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>
            <IonButton color="primary">Remove Identity</IonButton>
          </IonCol>
        </IonRow> */}
        <IonRow>
          <IonCol>
            <IonLabel>REV Balance: <p className="balance">{ balance }</p></IonLabel>
          </IonCol>
        </IonRow>
      </IonGrid>
    </IonSlide>
  )
};

const IdentityScreen = connect(
  (state: HistoryState) => {
    return {
      registryUri: state.reducer.registryUri,
      user: state.reducer.user,
      publicKey: state.reducer.publicKey? state.reducer.publicKey : "",
    }
  },
  (dispatch: Dispatch) => { }
)(IdentityScreenComponent);

export default IdentityScreen;

