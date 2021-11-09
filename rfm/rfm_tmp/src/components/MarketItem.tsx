import { connect } from 'react-redux';
import React, {useState} from 'react';
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
  IonCard,
  IonInput,
  /*
  IonPage,
  IonHeader,
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
import { Bag, Folder, HistoryState, getPublicKey } from '../store';
import './MarketItem.scoped.css';
import { /*document as documentIcon,*/ trash, create, checkmarkCircle } from 'ionicons/icons';
import { bagIdFromAddress } from '../utils/bagIdFromAddress';
import { useTour } from '@reactour/tour';
//import { State } from '@ionic-selectable/core/dist/types/stencil-public-runtime';

interface MarketItemProps {
  publicKey: string;
  bag: Bag;
  registryUri: string;
  id: string;
  awaitsSignature: boolean;
  completed: boolean;
  onlyCompleted: boolean;
  folder: Folder;
  purchase: (registryUri: string, bagId: string, price: number, step: string) => void;
  sell: (registryUri: string, bagId: string, price: number) => void;
  user: string;
}

const MarketItemComponent: React.FC<MarketItemProps> = (
  props: MarketItemProps,
) => {
  const identity = localStorage.getItem('wallet');
  const { /*isOpen,*/ currentStep, /* steps,*/ setIsOpen, setCurrentStep /*, setSteps*/ } = useTour()
  //const history = useHistory();
  const priceInput = React.useRef<HTMLIonInputElement | null>(null);
  const [price, setPrice] = useState<number>();

  console.log(props.folder);
  return (
    <IonItemSliding className="container" disabled>
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
        <IonCard class="MarketItemCard MarketCard"
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
                      <IonLabel>
                        <h2>Owner: {props.bag.boxId}</h2>
                      </IonLabel>
                    </IonRow>
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
          { /*<div className="mainContainer"> */ }
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
              {identity? (
                undefined
              ) : (
                <IonButton
                  className="PurchaseButton"
                  onClick={() => {
                    setIsOpen(false);
                    props.purchase(
                      props.registryUri,
                      bagIdFromAddress(props.id),
                      props.bag.price || 0,
                      props.user === "buyer" ? "4" : "6"
                    );
                  }}
                >
                  Buy for {(props.bag.price || 0) * (1 / 100000000)} REV
                </IonButton>
              )}

              {!identity? (
                  undefined
              ) : (
                <div>
                  <IonLabel position="floating" color="primary">
                    Enter price
                  </IonLabel>
                  <IonInput
                    ref={priceInput} 
                    
                    color="primary"
                    placeholder="enter price(in rev) of nft"
                    type="number"
                    value={price || 30}
                    onKeyPress={e => {
                      if (e.key === 'Enter' && price && price > 0) {
                        setCurrentStep(currentStep + 1);
                      }
                    }}
                    onIonChange={e => {
                      console.info(parseInt((e.target as HTMLInputElement).value))
                      const inPrice = parseInt((e.target as HTMLInputElement).value);
                        setPrice(inPrice)
                      }
                    }
                  />
                  <IonButton
                  
                  className="SellButton"
                  onClick={() => {
                    setIsOpen(false);
                    props.sell(
                      props.registryUri,
                      bagIdFromAddress(props.id),
                      price || 3000000000
                    );
                  }}
                >
                  Sell for {(price || 3000000000) * (1 / 100000000)} REV
                </IonButton>
                </div>
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
      //bags: state.reducer.bags,
      //bagsData: state.reducer.bagsData,
      //state: state,
      user: state.reducer.user,
      publicKey: getPublicKey(state) as string,
    };
  },
  (dispatch: Dispatch) => {
    return {
      purchase: (registryUri: string, bagId: string, price: number, step: string) => {
        dispatch({
          type: 'PURCHASE_BAG',
          payload: {
            bagId: bagId,
            registryUri: registryUri,
            price: price,
            step: step,
          },
        });
      },

      sell: (registryUri: string, bagId: string, price: number) => {
        dispatch({
          type: 'SELL_BAG',
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
