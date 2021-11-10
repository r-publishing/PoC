import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonLoading,
  IonButtons,
  IonButton,
  //IonProgressBar,
  //IonIcon,
  IonLabel,
  IonItem,
  IonInput,
  IonChip,
  /*
  IonItemSliding,
  IonItemOption,
  IonItemOptions,
  IonIcon,
  IonRange
  */
  //IonCard,
  //IonCardContent,
} from '@ionic/react';
//import { closeCircle, downloadOutline } from 'ionicons/icons';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { useHistory } from 'react-router';
import { /*Page,*/ pdfjs, /*Document as PdfDocument*/ } from 'react-pdf';
//import { trash, mailUnreadOutline, lockClosedOutline, lockOpenOutline } from 'ionicons/icons';

//import QRCodeComponent from './QRCodeComponent';
import checkSignature from '../utils/checkSignature';
import { State, HistoryState, getPlatform } from '../store';

import './ModalDocument.scoped.css';
import { addressFromPurseId } from 'src/utils/addressFromPurseId';

import { useTour } from '@reactour/tour';

//import { getResolver as getRchainResolver, Resolver } from "rchain-did-resolver";
//import * as rchainToolkit from 'rchain-toolkit';

export interface KeyPair {
  privateKey: any;
  publicKey: any;
  publicAddress: string;
}

interface ModalDocumentProps {
  state: HistoryState;
  registryUri: string;
  bagId: string;
  bags: State['bags'];
  bagsData: State['bagsData'];
  platform: string;
  user: string;
  loadBag: (registryUri: string, bagId: string, state: HistoryState) => void;
  reupload: (resitryUri: string, bagId: string) => void;
  publish: (resitryUri: string, bagId: string, price: number, fees: Array<{
    revAddress: string;
    fraction100: number;
}>) => void;
}
/*
interface DocumentInfo {
  numPages: number;
}
*/


const attestSteps = [
  { selector: '.SignatureRequiredBtn', content: 'If the photo looks legit you can now attest it and put your signature.' },
]

const publisherSteps = [
  { selector: '.attestation-step-file', content: 'Pick a photo you wish to upload.' },
  //{ selector: '.attestation-step-main-file', content: 'Set your photo as your main file.' },
  { selector: '.attestation-step-name', content: 'Choose a name for your NFT.' },
  //{ selector: '.attestation-step-select-attestor', content: 'Click here and appoint an attestor.',
    //highlightedSelectors: ["ionic-selectable-modal.ion-page"],
    //mutationObservables: ["ion-modal.show-modal.modal-interactive"]
  //},
  { selector: '.attestation-step-upload', content: 'Now press upload to begin attestation process.' },
  { selector: '.attestation-step-set-price', content: "How much REV do you think it's worth? Probably not a lot but let's put a large number anyway." },
]

const publishSteps = [
  { selector: '.attestation-step-set-price', content: "How much do you think it is worth? Probably not a lot but let's put a large number anyway." },
  { selector: '.attestation-step-set-price', content: "Come on now... don't be greedy!" },
  { selector: '.attestation-step-do-publish', content: "Now press it. Press it for glory!." },
]


const ModalDocumentComponent: React.FC<ModalDocumentProps> = (
  props: ModalDocumentProps
) => {
  
  const history = useHistory();
  const priceInput = React.useRef<HTMLIonInputElement | null>(null);
  //const pdfcontent64 = '';
  //const [page, setPage] = useState<number>();

  //const [numPages, setNumPages] = useState<number>();
  const [price, setPrice] = useState<number>();
  /*
  const [recipientInput, setRecipientInput] = useState<string>();
  const [revAddresses, setRevAddresses] = useState<Map<string, string>>(new Map<string, string>([
  ]));

  const [payees, setPayees] = useState<Map<string, {revAddress: string, fraction100: number}>>(new Map<string, {revAddress: string, fraction100: number}>([
  ]));

  const [distribution, setDistribution] = useState<number>(25);
  */
  const payees = new Map<string, {revAddress: string, fraction100: number}>([]); //TMP
  /*
  function onDocumentLoadSuccess(docInfo: DocumentInfo) {
    setNumPages(docInfo.numPages);
  }
  */

  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version
    }/pdf.worker.js`;

  const { /* isOpen,*/ currentStep, /* steps,*/ setIsOpen, setCurrentStep, setSteps } = useTour()
  //useEffect(() => {
//
  //}, []);
    /*
  useEffect(() => {
    console.info("PRICE UPDATE");
    if (price && price >= 10200) {
      setCurrentStep(currentStep + 1);
    }
  }, [price])
*/

  useEffect(() => {
    
    setTimeout(() => {
      if (props.user === "publisher") {
        if (localStorage.getItem('tour')) {
          const menuTourStep = parseInt(localStorage.getItem('tour') || '0');
          if (menuTourStep === 0) {
            setTimeout(() => {
              setIsOpen(false);
              setSteps(publisherSteps);
              setCurrentStep(0);
              setIsOpen(true);
            }, 100);
          }
          if (menuTourStep === 2) {
            setTimeout(() => {
              setIsOpen(false);
              setSteps(publishSteps);
              setCurrentStep(0);
              setIsOpen(true);
              if (priceInput && priceInput.current) {
                console.info("SET PRICE");
                (priceInput.current as HTMLIonInputElement).value = 20;
                (priceInput.current as HTMLIonInputElement).setFocus();
                setTimeout(() => {
                  setCurrentStep(2);
                  console.info("currentStep: ");
                  console.info(currentStep);
                }, 6000);
              }
            }, 100);
          }
          //else {
          //  setIsOpen(false);
          //}
        }
        else {
        setSteps(publisherSteps);
        }
      }
      if (props.user === "attestor") {
        setSteps(attestSteps);
      }
      setTimeout(() => {
        setIsOpen(false);
        setCurrentStep(0);
        setIsOpen(true);
      }, 888)
    }, 100);
    

    props.loadBag(props.registryUri, props.bagId, props.state);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /*
  const renderLoading = () => {
    return <IonProgressBar color="secondary" type="indeterminate" />;
  };
  */

  

  const address = addressFromPurseId(props.registryUri, props.bagId);

  console.log(props.bagsData[address]);

  const areSignaturesValid = async () => {
    return new Promise<boolean>((resolve => {
      Promise.all<boolean>(
        Object.keys(folder.signatures).reduce((promises: Array<Promise<boolean>>, s) => {
          return [checkSignature(folder, s), ...promises]
        }, [])
      ).then((values) => {
          resolve(values.reduce((isSigned: boolean, item: boolean) => {
            return item !== false && isSigned;
          }, false))
      })
    }));
  }
  /*
  const doDownload = () => {
    if (props.platform === "web") {
      var fileUrl = "data:" + folder.mimeType + ";base64," + folder.data;

      fetch(fileUrl).then(response => response.blob()).then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement("a");
        link.href = url;
        const fileName = folder.name;
        link.setAttribute("download", fileName);
        window.document.body.appendChild(link);
        link.click();
      });
    }
    else {
      //TODO
    }
  };
  */

  const folder = props.bagsData[address];
  let lastSignature: string | undefined = undefined;
  if (folder && folder.signatures) {
    if (folder.signatures['0']) lastSignature = '0';
    if (folder.signatures['1']) lastSignature = '1';
  }

  return (
    <>
      {/*
      <IonHeader>
        <IonToolbar>
          <IonTitle>{props.bagId}</IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={() => {
                history.replace('/doc', { direction: 'back' });
              }}
            >
              Close
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      */}
    
      <IonContent className="modal-document">
        
        {typeof document === 'undefined' ? (
          <IonLoading isOpen={true} />
        ) : (
          undefined
        )}
        {document === null ? (
          <span className="no-document">No document attached</span>
        ) : (
          /*
          <div className="qrCodeContainer">
            <QRCodeComponent
              url={`did:rchain:${props.registryUri}/${props.bagId}`}
            />
          </div>
          */
          undefined
        )}
        {/* document ? (
          <div className="ps5">
            <div className="document">
              <div className="left">
                {['application/pdf'].includes(
                  folder.mimeType
                ) ? (
                    <div
                      className="pdf"

                    ><span>PDF</span></div>
                  ) : (
                    <React.Fragment />
                  )}
              </div>
              <div className="right">
                <h5>
                  {props.bagsData[address].name}
                </h5>
                <h5>
                  Date (UTC) {props.bagsData[address].date}
                </h5>
                <h5>
                  {
                    props.bagsData[address].mimeType
                  }
                </h5>
              </div>
            </div>
             */}

        <IonButtons className="ButtonArray">
          <IonButton
            color="primary"
            onClick={() => {
              history.replace('/doc', { direction: 'back' });
            }}
          >
            Close
          </IonButton>
        </IonButtons>
        <div className="FloatingBottomLeft">
          <div className="Files">
            {Object.keys(folder.files).map(filename => {
              const file = folder.files[filename];
              return (
                <div key={filename}>
                  {['image/png', 'image/jpg', 'image/jpeg'].includes(
                    file.mimeType
                  ) ? (
                    <div
                      className={`ImageFrame ${
                        folder.mainFile === filename ? 'main' : ''
                      }`}
                    >
                      <img
                        className="Image"
                        alt={file.name}
                        src={`data:${file.mimeType};base64, ${file.data}`}
                      />
                    </div>
                  ) : (
                    <React.Fragment />
                  )}
                </div>
              );
            })}
          </div>
          {Object.keys(folder.signatures).map(s => {
            return (
              <IonChip key={s} className="signature-line">
                {checkSignature(folder, s) ? (
                  <>
                    <span className="signature-ok">✓</span>
                    {`signature n°${s} verified (${folder.signatures[
                      s
                    ].publicKey.slice(0, 12)}…)`}
                  </>
                ) : (
                  <>
                    <span>✗</span>
                    {`signature n°${s} invalid (${folder.signatures[
                      s
                    ].publicKey.slice(0, 12)}…)`}
                  </>
                )}
              </IonChip>
            );
          })}
          {areSignaturesValid() && props.user === 'publisher' ? (
            <div>
              <IonItem>
                <IonLabel position="floating" color="primary">
                  Enter price
                </IonLabel>
                <IonInput
                  ref={priceInput} 
                  class="attestation-step-set-price"
                  color="primary"
                  placeholder="enter price(in rev) of nft"
                  type="number"
                  value={price}
                  onKeyPress={e => {
                    if (e.key === 'Enter' && price && price > 0) {
                      setCurrentStep(currentStep + 1);
                    }
                  }}
                  onIonChange={e => {
                    const inPrice = parseInt((e.target as HTMLInputElement).value);
                      setPrice(inPrice)
                    }
                  }
                />
              </IonItem>
              { /*
              <IonItem>
              <IonInput 
                  class="attestation-step-set-revaddr"
                  color="primary"
                  placeholder="Add a recipient REV addr"
                  type="text"
                  value={recipientInput}
                  onIonChange={e => {
                    const inRecipient = (e.target as HTMLInputElement).value;
                      setRecipientInput(inRecipient)
                    }
                  }
                >
                  <IonButton slot="end" onClick={async () => {
                    console.info("CLICK");
                    if (recipientInput) {
                      let revAddr = "";
                      console.info("recipientInput:");
                      console.info(recipientInput);
                      

                      const resolver = new Resolver({
                        ...getRchainResolver()
                      });
                      try {
                        const parsed = await resolver.resolve("did:rchain:"+props.registryUri+"/" + recipientInput);
                        
                        const pubKey = parsed.publicKey[0].publicKeyHex;
                        if (pubKey) {
                          revAddr = rchainToolkit.utils.revAddressFromPublicKey(pubKey);
                          console.info("REV ADDRESS:");
                          console.info(revAddr);
                        }

                      }
                      catch (err) {
                        console.info("not a did");
                      }
                      
                      setRevAddresses(new Map<string, string>([ [recipientInput, revAddr], ...revAddresses]));
                      //setRevDistribution(new Map<string, number>([ [recipientInput, 25], ...revDistribution]));
                      setPayees(new Map<string, {revAddress: string, fraction100: number}>([ [recipientInput, {"revAddress": revAddr, "fraction100": 100 * 100}], ...payees]));
                      setRecipientInput("");
                    }
                  }}>+</IonButton>
              </IonInput>
              </IonItem>

              */ }

              {/*
               [...payees.keys()].map( (val, index) => {
                const revAddress = payees.get(val)?.revAddress as string;
                const fraction = (payees?.get(val)?.fraction100 as number | 0) / 100;
              return (
              <IonItemSliding className="container" key={val}>
                <IonItemOptions side="end">
                  <IonItemOption
                    color="danger"
                    onClick={() => console.log('share clicked')}
                  >
                    <IonIcon icon={trash} size="large" />
                  </IonItemOption>
                </IonItemOptions>
                <IonItem
                  // eslint-disable-next-line no-useless-concat
                  detail={false}
                  button
                >
                  <IonLabel className="ion-text-wrap">
                    {val}
                  </IonLabel>
                  <IonRange pin={true} value={fraction} onIonChange={e => {
                    const newShare = e.detail.value as number * 100
                    const share = new Map<string, {revAddress: string, fraction100: number}>([[val, {"revAddress": revAddress, "fraction100": newShare}]]);
                    setPayees(new Map<string, {revAddress: string, fraction100: number}>([...payees, ...share]));

                    console.info(payees);
                  }
                    } />
                  <IonLabel>{fraction}%</IonLabel>
                  <IonButton icon-only color="none" class="LockButton">
                    <IonIcon icon={lockOpenOutline} size="small" color="light"/>
                  </IonButton>
                </IonItem>
              </IonItemSliding>)
              })
              */}

              <IonButton
                className="attestation-step-do-publish SignatureRequiredBtn"
                size="default"
                onClick={() => {
                  setIsOpen(false);
                  props.publish(props.registryUri, props.bagId, price || 0, [...payees.values()]);
                }}
              >
                Publish to Marketplace
              </IonButton>
            </div>
          ) : (
            <React.Fragment />
          )}
          {[undefined, '0'].includes(lastSignature) && (
            <IonButton
              className="SignatureRequiredBtn"
              size="default"
              onClick={() => {
                setIsOpen(false);
                props.reupload(props.registryUri, props.bagId);
              }}
            >
              Attest and Sign
            </IonButton>
          )}
        </div>
        </IonContent>
        
    </>
  );
};

const ModalDocument = connect(
  (state: HistoryState) => {
    return {
      bags: state.reducer.bags,
      bagsData: state.reducer.bagsData,
      state: state,
      platform: getPlatform(state),
      user: state.reducer.user
    };
  },
  (dispatch: Dispatch) => {
    return {
      loadBag: (registryUri: string, bagId: string, state: HistoryState) => {
        dispatch({
          type: 'LOAD_BAG_DATA',
          payload: {
            registryUri: registryUri,
            bagId: bagId,
            state: state,
          },
        });
      },
      reupload: (registryUri: string, bagId: string) => {
        dispatch({
          type: 'REUPLOAD_BAG_DATA',
          payload: {
            bagId: bagId,
            registryUri: registryUri,
          },
        });
      },
      publish: (registryUri: string, bagId: string, price: number, fees: Array<{
        revAddress: string;
        fraction100: number;
    }>) => {
        dispatch({
          type: 'PUBLISH_BAG_DATA',
          payload: {
            bagId: bagId,
            registryUri: registryUri,
            price: price,
            fees: fees
          },
        });
      },
    };
  }
)(ModalDocumentComponent);

export default ModalDocument;