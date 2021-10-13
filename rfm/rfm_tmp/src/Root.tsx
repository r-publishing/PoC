import React from 'react';
import { IonApp } from '@ionic/react';
import { App as MainApp } from './App';


/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
//import './theme/darkvariables.css';

import { TourProvider } from '@reactour/tour'

// configure the tour
const steps = [
  {
    selector: '.attestation-step-start',
    content: 'Login as Publisher to upload a photo.',
  },
  
  // ...
]

const App: React.FC = () => (
  <IonApp>
    <TourProvider steps={steps} showBadge={false} showCloseButton={false} showPrevNextButtons={false} showNavigation={true} onClickMask={() => {console.info("closing")}}>
      <MainApp></MainApp>
    </TourProvider>
  </IonApp>
);

export default App;
