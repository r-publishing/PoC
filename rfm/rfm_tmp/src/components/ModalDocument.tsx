import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonLoading,
  IonButtons,
  IonButton,
  IonProgressBar,
  IonIcon,
  IonLabel
} from '@ionic/react';
import { closeCircle, downloadOutline } from 'ionicons/icons';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { useHistory } from 'react-router';
import { Page, pdfjs, Document as PdfDocument } from 'react-pdf';

import QRCodeComponent from './QRCodeComponent';
import checkSignature from '../utils/checkSignature';
import { State, Document, HistoryState, getPlatform } from '../store';

import './ModalDocument.scoped.css';
import { addressFromBagId } from 'src/utils/addressFromBagId';

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
  loadBag: (registryUri: string, bagId: string, state: HistoryState) => void;
  reupload: (resitryUri: string, bagId: string) => void;
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

  const address = addressFromBagId(props.registryUri, props.bagId);

  const doDownload = () => {
    if (props.platform === "web") {
      var fileUrl = "data:" + document.mimeType + ";base64," + document.data;

      fetch(fileUrl).then(response => response.blob()).then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement("a");
        link.href = url;
        const fileName = document.name;
        link.setAttribute("download", fileName);
        window.document.body.appendChild(link);
        link.click();
      });
    }
    else {
      //TODO
    }
  };

  const document = props.bagsData[address];
  let signedDocument: Document | undefined;
  if (document) {
    signedDocument = {
      ...document,
      data: Buffer.from(document.data, 'utf-8').toString('base64'),
    };
  }
  let lastSignature = undefined;
  if (document && document.signatures) {
    if (document.signatures['0']) lastSignature = '0';
    if (document.signatures['1']) lastSignature = '1';
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
        <div className="TopLeftStrip"><IonButton className="DownloadButton" onClick={() => {
          doDownload();
        }}><IonIcon icon={downloadOutline} size="small" /><IonLabel>Download</IonLabel></IonButton></div>
        {document && 'application/pdf' === document.mimeType ? (
          <PdfDocument
            file={'data:application/pdf;base64,' + document.data}
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
        )}
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
                  document.mimeType
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

        {document && (
          <div className="FloatingBottomLeft">
            {['image/png', 'image/jpg', 'image/jpeg'].includes(
                  document.mimeType
                ) ? (
                    <img
                      alt={document.name}
                      src={`data:${document.mimeType};base64, ${document.data}`}
                    />
                  ) : (
                    <React.Fragment />
                  )}
            {Object.keys(document.signatures).map(s => {
              return (
                <p className="signature-line" key={s}>
                  {checkSignature(signedDocument as Document, s) ? (
                    <>
                      <span className="signature-ok">✓</span>
                      {`signature n°${s} verified (${document.signatures[
                        s
                      ].publicKey.slice(0, 12)}…)`}
                    </>
                  ) : (
                    <>
                      <span>✗</span>
                      {`signature n°${s} invalid (${document.signatures[
                        s
                      ].publicKey.slice(0, 12)}…)`}
                    </>
                  )}
                </p>
              );
            })}
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
        )}
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
    };
  }
)(ModalDocumentComponent);

export default ModalDocument;