import { Folder } from '../store';

const { blake2b } = require('blakejs');

export default (folder: Folder): Uint8Array => {
  const signaturesOrdered: [string, string][] = [];
  let ordered: (string | [string, string][])[] = [
    signaturesOrdered,
  ];
  if (folder.signatures[0]) {
    signaturesOrdered[0] = [
      folder.signatures[0].publicKey,
      folder.signatures[0].signature,
    ];
  }
  if (folder.signatures[1]) {
    signaturesOrdered[1] = [
      folder.signatures[1].publicKey,
      folder.signatures[1].signature,
    ];
  }
  if (folder.signatures[2]) {
    signaturesOrdered[2] = [
      folder.signatures[2].publicKey,
      folder.signatures[2].signature,
    ];
  }

  const uInt8Array = new Uint8Array(
    Buffer.from(JSON.stringify({ fields: ordered }))
  );
  return blake2b(uInt8Array, 0, 32);
};
