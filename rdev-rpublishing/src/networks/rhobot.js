// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import { rhobotNETWORK } from './MasterURI.rhobot.json';

export const rhobot = {
   hostPattern: 'rhobot',
   observerBase: 'https://rnodeapi.rhobot.net',
   // TODO: rotate validators
   validatorBase: 'https://rnodeapi.rhobot.net',
   adminBase: 'https://rnodeadmin.rhobot.net',
   MasterURI: rhobotNETWORK.MasterURI,
}
