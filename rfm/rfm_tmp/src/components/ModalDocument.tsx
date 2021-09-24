import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonLoading,
  IonButtons,
  IonButton,
  IonProgressBar,
  IonIcon,
  IonLabel,
  IonItem,
  IonInput
} from '@ionic/react';
import { closeCircle, downloadOutline } from 'ionicons/icons';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { useHistory } from 'react-router';
import { Page, pdfjs, Document as PdfDocument } from 'react-pdf';

import QRCodeComponent from './QRCodeComponent';
import checkSignature from '../utils/checkSignature';
import { State, Folder, HistoryState, getPlatform } from '../store';

import './ModalDocument.scoped.css';
import { addressFromPurseId } from 'src/utils/addressFromPurseId';

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
  publish: (resitryUri: string, bagId: string, price: number) => void;
}

interface DocumentInfo {
  numPages: number;
}

const ModalDocumentComponent: React.FC<ModalDocumentProps> = (
  props: ModalDocumentProps
) => {
  const history = useHistory();
  const pdfcontent64 = '';
  const [page, setPage] = useState<number>();

  const [numPages, setNumPages] = useState<number>();
  const [price, setPrice] = useState<number>();
  function onDocumentLoadSuccess(docInfo: DocumentInfo) {
    setNumPages(docInfo.numPages);
  }

  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version
    }/pdf.worker.js`;

  useEffect(() => {
    props.loadBag(props.registryUri, props.bagId, props.state);
  });

  const renderLoading = () => {
    return <IonProgressBar color="secondary" type="indeterminate" />;
  };

  const address = addressFromPurseId(props.registryUri, props.bagId);

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

  const doDownload = () => {
    if (props.platform === "web") {
      /* TODO
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
      */
    }
    else {
      //TODO
    }
  };

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
        {/* <div className="TopLeftStrip"><IonButton className="DownloadButton" onClick={() => {
          doDownload();
        }}><IonIcon icon={downloadOutline} size="small" /><IonLabel>Download</IonLabel></IonButton></div>
        {
        /* TODO
        document && 'application/pdf' === folder.mimeType ? (
          <PdfDocument
            file={'data:application/pdf;base64,' + folder.data}
            loading={renderLoading}
            onLoadSuccess={onDocumentLoadSuccess}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <Page
                className="PdfPage"
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                pageIndex={index}
              />
            ))}
          </PdfDocument>
        ) : (
          <React.Fragment />
        )
        */}
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
        {
        /* document ? (
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
        {
          Object.keys(folder.files).map(filename => {
            const file = folder.files[filename];
            return (
              <div key={filename}>
              {['image/png', 'image/jpg', 'image/jpeg'].includes(
                    file.mimeType
                  ) ? (
                      <div className={`ImageFrame ${folder.mainFile === filename ? "main" : ""}`}>
                        <img
                          className="Image"
                          alt={file.name}
                          src={`data:${file.mimeType};base64, ${file.data}`}
                        />
                      </div>
                    ) : (
                      <React.Fragment />
                    )}
            </div>)
          })
          }
          </div>
              {Object.keys(folder.signatures).map(s => {
                return (
                  <p className="signature-line" key={s}>
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
                  </p>
                );
              })}
                {
                  areSignaturesValid() && props.user === "publisher" ? (
                    <div>
                    <IonItem>
                      <IonLabel position="floating" color="primary">
                        Enter price
                      </IonLabel>
                      <IonInput 
                        color="primary"
                        placeholder="enter price(in rev) of nft"
                        type="number"
                        value={price}
                        onIonChange={e =>
                          setPrice(parseInt((e.target as HTMLInputElement).value))
                        }
                      />
                    </IonItem>
                    <IonButton
                      className="SignatureRequiredBtn"
                      size="default"
                      onClick={() => {
                        props.publish(props.registryUri, props.bagId, price || 0);
                      }}
                    >
                      Publish to Marketplace
                    </IonButton>
                    </div>
                  ) : (<React.Fragment />)
                }
              {[undefined, '0'].includes(lastSignature) && (
                <IonButton
                  className="SignatureRequiredBtn"
                  size="default"
                  onClick={() => {
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
      publish: (registryUri: string, bagId: string, price: number) => {
        dispatch({
          type: 'PUBLISH_BAG_DATA',
          payload: {
            bagId: bagId,
            registryUri: registryUri,
            price: price
          },
        });
      },
    };
  }
)(ModalDocumentComponent);

export default ModalDocument;