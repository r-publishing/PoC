import React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import {
  IonContent,
  IonTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonIcon,
  IonButtons,
  IonButton,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonSelect,
  IonSelectOption
} from '@ionic/react';
import { document as documentIcon, trash, create } from 'ionicons/icons';
import { useHistory, RouteComponentProps } from 'react-router';

import {
  Bag,
  Folder,
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
  upload: (bagId: string, folder: Folder, did: string, files: any/*, price: string*/) => void;
  platform: string;
  //recipient: string;
}
interface ModalUploadDocumentState {
  recipient: string;
  mainFile: string;
  bagId: string;
  dropErrors: string[];
  folder: undefined | Folder;
  files: undefined | any;
  platform: string;
  //price: string;
}

let folder: Folder = {
  signatures: {},
  date: new Date().toUTCString(),
  files: {},
  mainFile: ""
};

class ModalUploadDocumentComponent extends React.Component<
  ModalUploadDocumentProps,
  ModalUploadDocumentState
> {
  constructor(props: ModalUploadDocumentProps) {
    super(props);

    this.state = {
      folder: undefined,
      recipient: '',
      mainFile: '',
      bagId: '',
      dropErrors: [],
      platform: props.platform,
      files: {}
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

    const folder: Folder = {
      signatures: {},
      date: new Date().toUTCString(),
      files: {
        [file0.name]: {
          name: file0.name,
          mimeType: fileBlob.type,
          data: Buffer.from(asbase.split(',')[1]).toString('base64'),
        }
      },
      mainFile: ""
    }

    folder.mainFile = folder.mainFile || Object.keys(folder.files)[0];

    that.setState({
      folder: {...folder},
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

    this.setState({ dropErrors: [] });

    Array.from(files).map(file => {
      var r = new FileReader();
      try {
        r.onloadend = async function(e) {
          if (!e || !e.target || typeof r.result !== 'string') {
            return;
          }

          that.setState({
            files: {
              ...that.state.files,
              [file.name]: {
                name: file.name,
                mimeType: file.type,
                data: r.result.split(',')[1],
              }
            },
          });
  
        };
      } catch (e) {
        this.setState({ dropErrors: ['Error parsing file'] });
      }
  
      r.readAsDataURL(file);
    })

    //folder.files = this.state.files;
    //folder.mainFile = folder.mainFile || Object.keys(files)[0];
  
    that.setState({
      folder: {
        ...folder,
        mainFile: folder.mainFile || Object.keys(files)[0]
      }
    });
    
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
              <IonLabel className="label">Request signature from:</IonLabel>
              <IonSelect color="primary" className="label" value={this.state.recipient} okText="Okay" cancelText="Dismiss" onIonChange={e => 
                  this.setState({
                    recipient: (e.target as HTMLInputElement).value,
                  })
              }>
                <IonSelectOption value="attestor">Attestor</IonSelectOption>
              </IonSelect>
            </IonItem>

          {this.props.platform === 'web' ? (
            <div
              className={`drop-area ${!!this.state.folder ? '' : ''}`}
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

{
            Object.keys(this.state?.files || {}).map(filename => {
              const file = this.state.files[filename];
              if (file) {
                return (
                  <IonItemSliding className="container" key={filename}>
                  <IonItemOptions side="end">
                    <IonItemOption
                      color="danger"
                      onClick={() => {
                        this.setState({
                          files: Object.keys(this.state?.files)
                          .filter(key => key !== filename)
                          .reduce((obj: any, key) => {
                            obj[key] = this.state?.files[key];
                            return obj;
                          }, {})
                        })
                      }}
                    >
                      <IonIcon icon={trash} size="large" />
                    </IonItemOption>
                  </IonItemOptions>
                  <IonItem
                    detail={false}
                    button
                    onClick={() => {
                      console.info("click on item");
                    }}
                  >
                    <div className="IconContainer">
                      <IonIcon icon={documentIcon} size="large" color="primary"/>
                    </div>
                    <IonLabel className="ion-text-wrap" color="primary">
                      <h2>{filename}</h2>
                    </IonLabel>
                  </IonItem>
                </IonItemSliding>
                )}
            })
            }

            <IonItem>
              <IonLabel className="label">Main file:</IonLabel>
              <IonSelect color="primary" className="label" value={this.state.mainFile} okText="Okay" cancelText="Dismiss" onIonChange={e => 
                  this.setState({
                    mainFile: (e.target as HTMLInputElement).value,
                  })
              }>
                {Object.keys(this.state?.files || {}).map(filename => {
                    return(<IonSelectOption value={filename} key={filename}>{filename}</IonSelectOption>)
                  })
                }
              </IonSelect>
            </IonItem>

          { /*this.state.folder ? (
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
          ) */}
          {this.state.folder ? (
            <IonItem>
              <IonButton
                className="AddButton"
                disabled={!this.state.folder || !this.state.bagId || !this.state.mainFile}
                onClick={() => {
                  this.props.upload(
                    this.state.bagId,
                    this.state.folder as Folder,
                    this.state.recipient as string,
                    this.state.files
                  );
                }}
              >
                Upload
              </IonButton>
              <IonButton
                className="AddButton"
                onClick={() => {
                  this.setState({ folder: undefined });
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
      upload: (bagId: string, folder: Folder, did: string, files: any/*, price: string*/) => {
        dispatch({
          type: 'UPLOAD',
          payload: {
            bagId: bagId,
            folder: {
              ...folder,
              files: files
            },
            recipient: did
          },
        });
      },
    };
  }
)(ModalUploadDocumentComponent);

export default withHistory(ModalUploadDocument);