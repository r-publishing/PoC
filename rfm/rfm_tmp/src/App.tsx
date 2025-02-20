import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import * as rchainToolkit from 'rchain-toolkit';
import React, { Suspense, useEffect, useState } from 'react';
import { Route, Redirect } from 'react-router-dom';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonRouterOutlet,
  IonLoading,
  IonButton,
  IonIcon,
  IonSlides,
  IonSlide,
  IonLabel,
  IonImg
} from '@ionic/react';
import './App.scss';
import './App.scoped.css';
import { Bag, HistoryState } from './store';

import IdentityScreen from './components/identity/IdentityScreen';

import { personCircle, closeCircleOutline } from 'ionicons/icons';

import { Device } from "@capacitor/device";

import axios from 'axios';
import queryString from 'query-string';
import { useTour } from '@reactour/tour';
import Logo from './assets/logo.png';

const LoginView = React.lazy(() => import('./views/LoginView'));
const DockListView = React.lazy(() => import('./views/DocListView'));
const PublicStore = React.lazy(() => import('./views/PublicStoreView'));

interface AppProps {
  authorised: boolean;
  isLoading: boolean;
  registryUri: undefined | string;
  user: string;
  bags: { [id: string]: Bag };
  init: (a: { registryUri: string; privateKey: string; user: string }) => void;
  setPlatform: (platform: string) => void;
  setUser: (user: string) => void;
}

interface Demo {
  id: string;
  masterRegistryUri: string;
  publisherPrivKey: string;
  attestorPrivKey: string;
  alicePrivKey: string;
  bobPrivKey: string;
}

const AppComponent: React.FC<AppProps> = props => {
  const redfill = React.useRef(null);
  const [showIdentity, setShowIdentity] = useState(false);
  const [demo, setDemo] = useState<Demo>();

  const { setIsOpen, setCurrentStep, setSteps, currentStep } = useTour();

  const identity: any = localStorage.getItem('user'); //TODO

    props.setUser(identity);
    console.log(identity);
  /*
  const shortenName = () => {
    return "did:rchain:" + props.registryUri?.substring(0, 6) + "..." + props.registryUri?.substring(48, 54)
  }
  */

  const ToggleIdentityView = () => {
    setShowIdentity(!showIdentity);
    console.info(showIdentity);
  };

  useEffect(() => {
    const params = queryString.parse(window.location.search) || {};
    console.info("params:");
    console.info(params);
    
    if (params && params.step) {
      const step = params.step || '0';
      localStorage.setItem('tour', step as string);
    }
    /*
    setDemo({
      id: "2",
      masterRegistryUri: "uq8guq3eazq8a3gsqzicnb86tep6jah46fcb5ga4s4o3uwgic3xjix",
      publisherPrivKey: "97b1744400bf6e7163418f3f67325921e8bc504bd09f3f20a5d864a41d05dfd9",
      attestorPrivKey: "f1b59bd5dc94fe4c34d1ea4862183b44d4f075036733f319b0e8cd7a1d1c6dc5",
      alicePrivKey: "ea6163135d7090822009495a526c124d6943c5d57b218e430dbce55c32a7aa8e",
      bobPrivKey: "429e2d42008ca2c29da5826902d875086087e02fc7e3d00bd7f38ecac33dcdd8"
    });
    */
    
      const existingDemo = localStorage.getItem('demo');
      if (existingDemo && Object.keys(existingDemo).length > 0) {
        const demo = JSON.parse(existingDemo);
        console.info("DEMO:");
        console.info(demo);
        setDemo(demo);
      }
      else {
        axios.get('https://thirsty-villani-4b6e68.netlify.app/pop').then(function (response) {
          // handle success
          console.info(response);
          const demo = response.data as Demo;
          setDemo(demo);
          if (Object.keys(demo).length > 0) {
            localStorage.setItem('demo', JSON.stringify(demo));
            setIsOpen(true);
          }
        })
      }
    
  }, []);

  useEffect(() => {
    Device.getInfo().then(info => {
      props.setPlatform(info.platform);
    });
  });

  const slideOpts: Record<string, unknown> = {
    initialSlide: 0,
    speed: 400,
  };

  const onSlideChanged = (event: any) => {
    event.target.getActiveIndex().then((value: any) => {
      console.info(value);
    });
  };

  function reload() {
    setTimeout(() => {
    window.location.reload();
  }, 100);
  }


  if (!props.authorised) {
    return (
      <IonRouterOutlet id="main">

        <Route
          exact
          path="/user"
          render={rprops => (
            <Suspense fallback={<IonLoading isOpen={true} />}>
              <LoginView action="user" key={rprops.location.pathname} demo={demo}/>
            </Suspense>
          )}
        />
        <Route
          exact
          path="/user/new"
          render={rprops => (
            <Suspense fallback={<IonLoading isOpen={true} />}>
              <LoginView action="new" key={rprops.location.pathname} demo={demo}/>
            </Suspense>
          )}
        />
        <Route
          exact
          path="/user/restore"
          render={rprops => (
            <Suspense fallback={<IonLoading isOpen={true} />}>
              <LoginView action="restore" key={rprops.location.pathname} demo={demo}/>
            </Suspense>
          )}
        />
        <Route
          path="/"
          exact
          render={rprops => (
            <Suspense fallback={<IonLoading isOpen={true} />}>
              <LoginView action="user" key={rprops.location.pathname} demo={demo}/>
            </Suspense>
          )}
        />
        <Route
          path="*"
          render={rprops => (
            <Suspense fallback={<IonLoading isOpen={true} />}>
              <LoginView action="user" key={rprops.location.pathname} demo={demo}/>
            </Suspense>
          )}
        />
        { /*
        <Route
          path="*"
          render={rprops => (
            <Suspense fallback={<IonLoading isOpen={true} />}>
              <LoginView action="user" key={rprops.location.pathname} demo={demo}/>
            </Suspense>
          )}
        />
          */ }
      </IonRouterOutlet>
    );
  }

  return (
    
    <IonPage id="home-page">
      
      <IonHeader no-border no-shadow className="ion-no-border">
        <IonToolbar className="noSafeAreaPaddingTop">
          <IonImg className="RPCLogo" slot="start" src={Logo}></IonImg>
          <IonTitle className="title"
            onClick={() => {
           reload()
          }}
          >RChain Publishing</IonTitle>
          
          <IonButton
            slot="end"
            icon-only
            color="none"
            class="ProfileButton"
            onClick={() => {
              ToggleIdentityView();
            }}
          >
            {showIdentity ? (
              <IonIcon icon={closeCircleOutline} size="large" />
            ) : (
                <div className="UserInfo" >
                  <IonLabel>{props.user}</IonLabel>
                  <IonIcon icon={personCircle} size="large" />
                </div>
              )}
          </IonButton>
        </IonToolbar>
        <div
          className={showIdentity ? 'RedFill show' : 'RedFill hide'}
          ref={redfill}
        >
          <IonContent className="IdentityBG">
            <div
              className={
                showIdentity ? 'ProfilePanel show' : 'ProfilePanel hide'
              }
            >
              <div className="ArrowLeft" />
              <div className="ArrowRight" />
              <IonSlides
                class="IdentityList"
                options={slideOpts}
                pager={true}
                onIonSlideDidChange={onSlideChanged}
              >
                <IonSlide className="IdentitySlide">
                  <IdentityScreen />
                </IonSlide>
              </IonSlides>
            </div>
          </IonContent>
        </div>
      </IonHeader>
      <IonContent>
        { /*<RChainLogo className="BackgroundLogo" /> */ }

        {
          (identity === "buyer" || identity === "buyer2") ? (
                  <Suspense fallback={<IonLoading isOpen={true} />}>
                    <PublicStore
                      registryUri={props.registryUri as string}
                      action="list"
                    />
                  </Suspense>
          )
            :
            (
            <IonRouterOutlet id="main">
              <Route
                exact
                path="/doc/show/:registryUri/:bagId?"
                render={rprops => (
                  <Suspense fallback={<IonLoading isOpen={true} />}>
                    <DockListView
                      registryUri={rprops.match.params.registryUri}
                      bagId={rprops.match.params.bagId}
                      action="show"
                      key={rprops.location.hash}
                    />
                  </Suspense>
                )}
              />
              <Route
                exact
                path="/doc"
                render={rprops => (
                  <Suspense fallback={<IonLoading isOpen={true} />}>
                    <DockListView
                      registryUri={props.registryUri as string}
                      action="list"
                      key={rprops.location.hash}
                    />
                  </Suspense>
                )}
              />
              <Route
                exact
                path="/doc/upload"
                render={rprops => (
                  <Suspense fallback={<IonLoading isOpen={true} />}>
                    <DockListView
                      registryUri={props.registryUri as string}
                      action="upload"
                      key={rprops.location.hash}
                    />
                  </Suspense>
                )}
              />
              <Route
                path="/"
                render={({ location }) => (
                  <Redirect
                    to={{
                      pathname: '/doc',
                      state: { from: location },
                    }}
                  />
                )}
                exact
              />
            </IonRouterOutlet>
          )
        }
      </IonContent>
    </IonPage>
  );
};

export const App = connect(
  (state: HistoryState) => {
    return {
      authorised: state.reducer.authorised,
      registryUri: state.reducer.registryUri,
      user: state.reducer.user,
      bags: state.reducer.bags,
      isLoading: state.reducer.isLoading,
    };
  },
  (dispatch: Dispatch) => {
    return {
      init: (a: { registryUri: string; privateKey: string; user: string}) => {
        dispatch({
          type: 'INIT',
          payload: {
            privateKey: a.privateKey,
            publicKey: rchainToolkit.utils.publicKeyFromPrivateKey(
              a.privateKey as string
            ),
            registryUri: a.registryUri,
            user: a.user
          },
        });
      },
      setPlatform: (platform: string) => {
        dispatch({
          type: 'SET_PLATFORM',
          payload: {
            platform: platform,
          },
        });
      },
      setUser: (user: string) => {
        dispatch({
          type: 'SET_USER',
          payload: {
            user: user,
          }
        })
      }
    };
  }
)(AppComponent);

export default App;
