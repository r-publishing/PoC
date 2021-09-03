import { connect } from 'react-redux';
import React from 'react';
import {
  IonIcon,
  IonItem,
  IonLabel,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonButton,
} from '@ionic/react';

import { useHistory } from 'react-router';
import { State, Bag, Document, HistoryState } from '../store';
import './MarketItem.scoped.css';

import { document as documentIcon, trash, create } from 'ionicons/icons';
import { bagIdFromAddress } from '../utils/bagIdFromAddress';

interface MarketItemProps {
  bag: Bag;
  registryUri: string;
  id: string;
  awaitsSignature: boolean;
  completed: boolean;
  onlyCompleted: boolean;
  document: Document;
}

const MarketItemComponent: React.FC<MarketItemProps> = ({
  onlyCompleted,
  id,
  awaitsSignature,
  completed,
  document,
}) => {
  console.log(document)
  const history = useHistory();
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
      <IonItem
        className={`${
          !onlyCompleted && Object.keys(document.signatures).length > 1
            ? 'with-parent'
            : ''
        } ${completed ? 'success' : 'secondary'}`}
        detail={false}
        button
        onClick={() => {
          history.push('/doc/show/' + id);
        }}
      >
        <div className="IconContainer">
          <IonIcon
            icon={documentIcon}
            color={completed ? 'success' : 'primary'}
            size="large"
          />
        </div>
        <IonLabel className="ion-text-wrap">
          <h2>{bagIdFromAddress(id)}</h2>
        </IonLabel>
        {!awaitsSignature && <span className="signature-ok">✓ verified</span>}
      </IonItem>
    </IonItemSliding>
  );
};

const MarketItem = connect(
  undefined,
  undefined
)(MarketItemComponent);

export default MarketItem;
