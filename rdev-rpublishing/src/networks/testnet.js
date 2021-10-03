// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import { testnetNETWORK } from './MasterURI.testnet.json';

export const testnet = {
   hostPattern: 'test',
   observerBase: 'https://observer.testnet.rchain.coop',
   // TODO: rotate validators
   validatorBase: 'https://node0.testnet.rchain-dev.tk',
   adminBase: '',
   MasterURI: testnetNETWORK.MasterURI,
}
