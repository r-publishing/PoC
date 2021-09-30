import React, { useEffect, useState } from 'react';
import {
  IonChip,
  IonLabel
} from '@ionic/react';

import { QRCodeRenderersOptions, toCanvas } from "qrcode";

import './QRCodeComponent.scoped.scss';

interface QRCodeComponentProps {
  url: string
}
const QRCodeComponent: React.FC<QRCodeComponentProps> = ({ url }) => {
  const qrcodecanvas = React.useRef(null);

  const [enlarged, setEnlarged] = useState(false);

  const ToggleSize = () => {
    setEnlarged(!enlarged);
  };

  useEffect(() => {
    //Update qr code
    if (url) {
      const opts = {
        errorCorrectionLevel: "H",
        width: enlarged ? 220 : 100,
        height: enlarged ? 220 : 100,
        margin: 1
      } as QRCodeRenderersOptions;

      toCanvas(
        qrcodecanvas.current,
        url,
        opts
      ).then(res => {
        console.info("QRCode created");
        console.info(res);
      });
    }
  }, [url, enlarged]);

  return (
    <IonChip className={enlarged ? "QRContainer large" : "QRContainer small"} color="tertiary" onClick={() => {
      ToggleSize();
    }}>
      <canvas ref={qrcodecanvas} className="Image" />
      <IonLabel color="dark">Scan to view</IonLabel>
    </IonChip>
  );
};

export default QRCodeComponent;
