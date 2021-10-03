// @ts-check

/**
 * @typedef {{ filename?: string, fields?: Record<string, FieldSpec> }} ActionSpec
 * @typedef {{ type: 'MasterURI' | 'number' | 'string' | 'set' | 'uri' | 'walletRevAddr' | 'MasterURI', value?: string }} FieldSpec
 * @type {Record<string, ActionSpec>}
 */
export const actions = {
  _select_an_action_: {
    fields: {},
  },
  checkBalance: {
    fields: {
      myGovRevAddr: { type: 'walletRevAddr' },
    },
    filename: 'actions/checkBalance.rho',
  },
  transfer: {
    fields: {
      revAddrFrom: { value: '', type: 'walletRevAddr' },
      revAddrTo: { value: '', type: 'string' },
      amount: { value: '100000000', type: 'number' },
    },
    filename: 'actions/transfer.rho',
  },
  _____________________________: {
    fields: {},
  },
  helloWorld: {
    fields: {},
    filename: 'actions/helloWorld.rho',
  },
  lookupURI: {
    fields: { URI: { value: '', type: 'uri' } },
    filename: 'actions/lookupURI.rho',
  },
  createURI: {
    fields: { value: { value: '', type: 'number' } },
    filename: 'actions/createURI.rho',
  },
};
