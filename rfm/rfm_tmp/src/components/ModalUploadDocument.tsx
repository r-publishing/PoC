import React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import {
  IonHeader,
  IonContent,
  IonToolbar,
  IonTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonIcon,
  IonButtons,
  IonButton,
} from '@ionic/react';
import { document as documentIcon } from 'ionicons/icons';
import { useHistory, RouteComponentProps } from 'react-router';

import {
  Bag,
  Document,
  getBags,
  getBagsData,
  getPublicKey,
  HistoryState,
  getPlatform,
} from '../store';

import './ModalUploadDocument.scoped.css';

import { FileSelect } from "capacitor-file-select";

//Instead of deprecated withRouter
export const withHistory = (Component: any) => {
  return (props: any) => {
    const history = useHistory();

    return <Component history={history} {...props} />;
  };
};

interface ModalUploadDocumentProps extends RouteComponentProps {
  state: HistoryState;
  publicKey: string;
  bags: { [bagId: string]: Bag };
  upload: (bagId: string, document: Document, did: string, price: string) => void;
  platform: string;
  //recipient: string;
}
interface ModalUploadDocumentState {
  recipient: string;
  bagId: string;
  dropErrors: string[];
  document: undefined | Document;
  platform: string;
  price: string;
}
class ModalUploadDocumentComponent extends React.Component<
  ModalUploadDocumentProps,
  ModalUploadDocumentState
> {
  constructor(props: ModalUploadDocumentProps) {
    super(props);

    this.state = {
      document: undefined,
      recipient: '',
      bagId: '',
      dropErrors: [],
      platform: props.platform,
      price: '',
    };
  }
  dropEl: HTMLTextAreaElement | undefined = undefined;

  blobToBase64 = (blob: Blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });

  nativeFilePicker = async () => {
    const that = this;
    let selectedFile = await FileSelect.select({
      multiple: false,
      extensions: ['.jpg', '.png', '.pdf', '.jpeg'],
    });

    const file0 = selectedFile.files[0];

    const fileResponse = await fetch(file0.path as any); //TODO: fix type inside the plugin
    const fileBlob = await fileResponse.blob();

    const asbase: string = (await this.blobToBase64(fileBlob)) as string;

    const document: Document = {
      name: file0.name,
      mimeType: fileBlob.type,
      data: Buffer.from(asbase.split(',')[1]).toString('base64'),
      signatures: {},
      date: new Date().toUTCString(),
    };

    that.setState({
      document: document,
    });
  };

  saveRef = (el: HTMLTextAreaElement) => {
    this.dropEl = el;
    if (this.dropEl) {
      this.dropEl.addEventListener('drop', (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        this.onDrop(e as any);
        return false;
      });
    }
  };

  onDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    const that = this;
    e.preventDefault();
    var files = e.dataTransfer.files;
    if (!files[0]) {
      this.setState({
        dropErrors: ['Please drop a file'],
      });
      return;
    }
    if (files[1]) {
      this.setState({
        dropErrors: ['Please drop only one file'],
      });
      return;
    }

    this.setState({ dropErrors: [] });
    const file = files[0];
    var r = new FileReader();
    try {
      r.onloadend = async function(e) {
        if (!e || !e.target || typeof r.result !== 'string') {
          return;
        }

        const document: Document = {
          name: file.name,
          mimeType: file.type,
          data: Buffer.from(r.result.split(',')[1]).toString('base64'),
          signatures: {},
          date: new Date().toUTCString(),
        };

        that.setState({
          document: document,
        });
      };
    } catch (e) {
      this.setState({ dropErrors: ['Error parsing file'] });
    }

    r.readAsDataURL(file);
  };

  //  readURL = (input: { files: Blob[]; }) => {
  //       if (input.files && input.files[0]) {
  //           var reader = new FileReader();

  //           reader.onload = function (e) {
  //               $('#blah')
  //                   .attr('src', e.target.result)
  //                   .width(150)
  //                   .height(200);
  //           };

  //           reader.readAsDataURL(input.files[0]);
  //       }
  //   }

  render() {
    return (
      <IonContent class="modal-document">
        <IonTitle class="upload-to-the-blockchain">
          Upload to the blockchain
        </IonTitle>

        <IonButtons className="ButtonArray">
          <IonButton
            color="primary"
            onClick={() => {
              this.props.history.replace('/doc', { direction: 'back' });
            }}
          >
            Close
          </IonButton>
        </IonButtons>

        <IonContent className="inner">
          <IonItem>
            <IonLabel className="label" position="floating">
              Enter name of document
            </IonLabel>
            <IonInput
              className="label"
              placeholder="document ID"
              type="text"
              value={this.state.bagId}
              onIonChange={e =>
                this.setState({
                  bagId: (e.target as HTMLInputElement).value,
                })
              }
            />
          </IonItem>
          <IonItem>
            <IonLabel className="label" position="floating">
              Enter price
            </IonLabel>
            <IonInput 
              className="label"
              placeholder="enter price of nft"
              type="number"
              value={this.state.price}
              onIonChange={e =>
                this.setState({
                  price: (e.target as HTMLInputElement).value,
                })
              }
            />
          </IonItem>
          {this.props.platform === 'web' ? (
            <div
              className={`drop-area ${!!this.state.document ? 'hide' : ''}`}
            >
              <textarea ref={this.saveRef} />
              <span>
                <IonIcon icon={documentIcon} size="large" /> Drop your file
              </span>
            </div>
          ) : (
            undefined
          )}
          {this.props.platform === 'ios' ||
          this.props.platform === 'android' ? (
            <IonButton
              onClick={() => {
                this.nativeFilePicker();
              }}
            >
              Pick a document
            </IonButton>
          ) : (
            undefined
          )}

          <IonItem>
            <IonLabel className="label" position="floating">
              Request signature from
            </IonLabel>
            <IonInput
              className="label"
              placeholder="did:rchain:<registryUri>"
              type="text"
              value={this.state.recipient}
              onIonChange={e =>
                this.setState({
                  recipient: (e.target as HTMLInputElement).value,
                })
              }
            />
          </IonItem>

          {this.state.document ? (
            <div className="document">
              <div className="left">
                <IonIcon icon={documentIcon} size="large" />
              </div>
              <div className="right">
                <h5>{this.state.document.name}</h5>
                <h5>{this.state.document.mimeType}</h5>
              </div>
            </div>
          ) : (
            undefined
          )}
          {this.state.document ? (
            <IonItem>
              <IonButton
                className="AddButton"
                disabled={!this.state.document || !this.state.bagId}
                onClick={() => {
                  this.props.upload(
                    this.state.bagId,
                    this.state.document as Document,
                    this.state.recipient as string,
                    this.state.price as string
                  );
                }}
              >
                Upload
              </IonButton>
              <IonButton
                className="AddButton"
                onClick={() => {
                  this.setState({ document: undefined });
                }}
              >
                Cancel
              </IonButton>
            </IonItem>
          ) : (
            undefined
          )}
        </IonContent>
      </IonContent>
    );
  }
}

const ModalUploadDocument = connect(
  (state: HistoryState) => {
    return {
      state: state,
      bags: getBags(state),
      bagsData: getBagsData(state),
      publicKey: getPublicKey(state) as string,
      platform: getPlatform(state),
    };
  },
  (dispatch: Dispatch) => {
    return {
      upload: (bagId: string, document: Document, did: string, price: string) => {
        dispatch({
          type: 'UPLOAD',
          payload: {
            bagId: bagId,
            document: document,
            recipient: did,
            price: price
          },
        });
      },
    };
  }
)(ModalUploadDocumentComponent);

export default withHistory(ModalUploadDocument);
