import { connect } from 'react-redux';
import React from 'react';
import {
  IonIcon,
  IonGrid,
  IonRow,
  //IonItem,
  IonLabel,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonButton,
  //IonPage,
  //IonHeader,
  IonCard,
  /*
  IonToolbar,
  IonTitle,
  */
  IonCardTitle,
  IonCardSubtitle,
  //IonCardContent,
  /*
  IonContent,
  */
  IonCardHeader
  
} from '@ionic/react';
//import { Card, Button } from 'react-bootstrap';

//import { useHistory } from 'react-router';
import { Dispatch } from 'redux';
import { Bag, Folder, HistoryState } from '../store';
import './MarketItem.scoped.css';
import { /*document as documentIcon,*/ trash, create, checkmarkCircle } from 'ionicons/icons';
import { bagIdFromAddress } from '../utils/bagIdFromAddress';

interface MarketItemProps {
  
  bag: Bag;
  registryUri: string;
  id: string;
  awaitsSignature: boolean;
  completed: boolean;
  onlyCompleted: boolean;
  folder: Folder;
  purchase: (registryUri: string, bagId: string, price: number) => void;
}

const MarketItemComponent: React.FC<MarketItemProps> = (
  props: MarketItemProps,
) => {
  const identity = localStorage.getItem('wallet');
  //const history = useHistory();

  console.log(props.folder);
  return (
    <IonItemSliding className="container">
      <IonItemOptions side="end">
        <IonItemOption
          color="secondary"
          onClick={() => console.log('favorite clicked')}
        >
          <IonIcon icon={create} size="large" />
        </IonItemOption>
        <IonItemOption
          color="danger"
          onClick={() => console.log('share clicked')}
        >
          <IonIcon icon={trash} size="large" />
        </IonItemOption>
      </IonItemOptions>
      {
        <IonCard class="MarketItemCard"
          className={`${
            !props.onlyCompleted &&
            Object.keys(props.folder.signatures).length > 1
              ? 'with-parent'
              : ''
          } ${props.completed ? 'success' : 'secondary'}`}
        >
          <IonCardHeader>
            <IonCardSubtitle>
                <IonLabel className="ion-text-wrap">
                  <h2>{bagIdFromAddress(props.id)}</h2>
                </IonLabel>
            </IonCardSubtitle>
            <IonCardTitle>
                {!props.awaitsSignature && (
                  <IonGrid>
                    <IonRow>
                    <IonIcon  icon={checkmarkCircle} color="success" />
                    <IonLabel className="ion-text-wrap">
                      <h2>Attested</h2>
                    </IonLabel>
                    </IonRow>
                  </IonGrid>
                )}
            </IonCardTitle>
          </IonCardHeader>
          <div className="mainContainer">
            <div className="IconContainer">
              {Object.keys(props.folder.files).map(filename => {
                const file = props.folder.files[filename];
                //console.log(file);
                return ['image/png', 'image/jpg', 'image/jpeg'].includes(
                  file.mimeType
                ) ? (
                  <div
                    className={`ImageFrame ${
                      props.folder.mainFile === filename
                        ? 'main'
                        : 'secondary'
                    }`}
                    key={filename}
                  >
                    <img
                      className="Image"
                      alt={file.name}
                        src={`data:${file.mimeType};base64, ${file.data}`}
                    />
                  </div>
                ) : (
                  <React.Fragment />
                );
              })}
            </div>
            <div className="labelContainer">
              {identity ? (
                undefined
              ) : (
                <IonButton
                  onClick={() => {
                    props.purchase(
                      props.registryUri,
                      bagIdFromAddress(props.id),
                      props.bag.price || 0
                    );
                  }}
                >
                  Buy for {(props.bag.price || 0) * (1 / 100000000)} REV
                </IonButton>
              )}
            </div>
          </div>
        </IonCard>
      }
    </IonItemSliding>
   
  );
};

const MarketItem = connect(
  (state: HistoryState) => {
    return {
      bags: state.reducer.bags,
      bagsData: state.reducer.bagsData,
      state: state,
    };
  },
  (dispatch: Dispatch) => {
    return {
      purchase: (registryUri: string, bagId: string, price: number) => {
        dispatch({
          type: 'PURCHASE_BAG',
          payload: {
            bagId: bagId,
            registryUri: registryUri,
            price: price
          },
        });
      },
    };
  }
)(MarketItemComponent);

export default MarketItem;
