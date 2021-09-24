import * as rchainToolkit from 'rchain-toolkit';

import generateHashFromDocument from './generateHashFromDocument';
import { Folder } from '../store';

export default (folder: Folder, privateKey: string) => {
  const blake2bHash = generateHashFromDocument(folder);
  const signature = rchainToolkit.utils.signSecp256k1(blake2bHash, privateKey);
  const signatureHex = Buffer.from(signature).toString('hex');

  return signatureHex;
};
