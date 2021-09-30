import { connect } from 'react-redux';
import React from 'react';
import { Dispatch } from 'redux';
import {
  IonItem,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { RefresherEventDetail } from '@ionic/core';
import { refreshOutline } from 'ionicons/icons';

import { useHistory } from 'react-router';
import './Horizontal.scoped.css';
import { HistoryState } from '../store';

interface HorizontalProps {
  registryUri: string;
  publicKey: string;
  searchText: string;
  refresh: (a: { publicKey: string; registryUri: string }) => void;
  setSearchText: (searchText: string) => void;
  user: string;
}

const HorizontalComponent: React.FC<HorizontalProps> = props => {
  const history = useHistory();

  const doFetch = () => {
    props.refresh({
      registryUri: props.registryUri,
      publicKey: props.publicKey,
    });
  };

  const doRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    doFetch();
    event.detail.complete();
  };

  return (
    <React.Fragment>
      <IonRefresher slot="fixed" onIonRefresh={doRefresh}>
        <IonRefresherContent />
      </IonRefresher>
      {/*
      <div>
        <IonItem class="connectedAs">Connected as {props.connected}</IonItem>
      </div>
      */}
      <div className="container">
        <IonItem
          detail={false}
          no-padding
          lines="none"
          className="SearchBarContainer"
        >
          {props.user === "publisher" ? (
          <IonButton
            className="AddButton with-border"
            icon-only
            slot="start"
            color="none"
            size="default"
            onClick={() => {
              history.push('/doc/upload/');
            }}
          >
            <span>upload</span>
          </IonButton>) : (<React.Fragment />)} {' '}
          { /*
          <IonButton
            className="AddButton with-border"
            icon-only
            slot="start"
            color="none"
            size="default"
            onClick={() => {
              doFetch();
            }}
          >
            <IonIcon icon={refreshOutline} /> <span>refresh</span>
          </IonButton>
          */ }
          <IonSearchbar
            color="none"
            value={props.searchText}
            onIonChange={e => props.setSearchText(e.detail.value!)}
          />
        </IonItem>
      </div>
    </React.Fragment>
  );
};

const Horizontal = connect(
  (state: HistoryState) => {
    return {
      registryUri: state.reducer.registryUri as string,
      publicKey: state.reducer.publicKey as string,
      searchText: state.reducer.searchText as string,
      user: state.reducer.user
    };
  },
  (dispatch: Dispatch) => {
    return {
      refresh: (a: { publicKey: string; registryUri: string }) => {
        dispatch({
          type: 'REFRESH',
          payload: a,
        });
      },

      setSearchText: (searchText: string) => {
        dispatch({
          type: 'SET_SEARCH_TEXT',
          payload: searchText,
        });
      },
    };
  }
)(HorizontalComponent);

export default Horizontal;
