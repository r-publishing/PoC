import { createJWS, EllipticSigner, Encrypter } from 'did-jwt'
import { decryptJWE, createJWE, JWE, Decrypter } from 'did-jwt'
import { EncryptionResult, Recipient } from 'did-jwt/lib/JWE'

import {
  HandlerMethods,
  RequestHandler,
  RPCConnection,
  RPCError,
  RPCRequest,
  RPCResponse,
  createHandler,
} from 'rpc-utils'
import stringify from 'fast-json-stable-stringify'
import * as u8a from 'uint8arrays'
import { ec as EC } from 'elliptic'
import {
  encrypt as aesencrypt,
  decrypt as aesdecrypt,
  PrivateKey,
  PublicKey as esicsPublicKey,
} from 'eciesjs'

const ec = new EC('secp256k1')
const B16 = 'base16'
const B64 = 'base64pad'

function toStableObject(obj: Record<string, any>): Record<string, any> {
  return JSON.parse(stringify(obj)) as Record<string, any>
}

export function encodeDID(secretKey: Uint8Array): string {
  const pubBytes = ec.keyFromPrivate(secretKey).getPublic(true, 'array')
  const bytes = new Uint8Array(pubBytes.length + 2)
  bytes[0] = 0xe7 // secp256k1 multicodec
  // The multicodec is encoded as a varint so we need to add this.
  // See js-multicodec for a general implementation
  bytes[1] = 0x01
  bytes.set(pubBytes, 2)
  return `did:key:z${u8a.toString(bytes, 'base58btc')}`
}

interface Context {
  did: string
  secretKey: Uint8Array
}

interface CreateJWSParams {
  payload: Record<string, any>
  protected?: Record<string, any>
  did: string
}

export interface PublicKey {
  id: string
  type: string
  controller: string
  ethereumAddress?: string
  publicKeyBase64?: string
  publicKeyBase58?: string
  publicKeyHex?: string
  publicKeyPem?: string
}

export interface CreateJWEParams {
  cleartext: Uint8Array
  recipients: Array<string>
  protectedHeader?: Record<string, any>
  aad?: Uint8Array //Additional Authenticated Data
}

interface RecipientHeader {
  alg: string
  iv: string //Initialization Vector
  tag: string
  epk?: Record<string, any> // Ephemeral  Public Key
  kid?: string
}

interface DecryptJWEParams {
  jwe: JWE
  did?: string
}

interface AuthParams {
  nonce: string
  aud: string
  paths: Array<string>
}

interface JWSSignature {
  protected: string
  signature: string
}

export interface GeneralJWS {
  payload: string
  signatures: Array<JWSSignature>
}

function toGeneralJWS(jws: string): GeneralJWS {
  const [protectedHeader, payload, signature] = jws.split('.')
  return {
    payload,
    signatures: [{ protected: protectedHeader, signature }],
  }
}

const sign = async (
  payload: Record<string, any>,
  did: string,
  secretKey: Uint8Array,
  protectedHeader: Record<string, any> = {}
): Promise<string> => {
  const kid = `${did}#${did.split(':')[2]}`
  const signer = EllipticSigner(u8a.toString(secretKey, B16))
  const header = toStableObject(Object.assign(protectedHeader || {}, { kid, alg: 'ES256K' }))
  return createJWS(toStableObject(payload), signer, header)
}

function validateHeader(header: RecipientHeader | undefined): void {
  if (!(header?.epk && header?.iv && header?.tag)) {
    throw new Error('Invalid JWE')
  }
}

export function aesDecrypter(secretKey: Uint8Array): Decrypter {
  const alg = 'A256GCMKW'
  //const keyLen = 256
  const crv = 'EC'
  // eslint-disable-next-line @typescript-eslint/require-await
  async function decrypt(
    sealed: Uint8Array,
    iv?: Uint8Array | undefined,
    _aad?: Uint8Array | undefined,
    recipient?: Record<string, any> | undefined
  ): Promise<Uint8Array> {
    validateHeader(recipient?.header)
    if (recipient?.header?.epk?.crv !== crv) return Buffer.from('')

    const k1 = new PrivateKey(Buffer.from(secretKey))

    const tag = sealed.slice(sealed.length - 16)
    const ciphered = sealed.slice(0, sealed.length - 16)

    const combo = Buffer.concat([
      Buffer.from(iv as Uint8Array),
      Buffer.from(tag),
      Buffer.from(ciphered),
    ])

    const decryptedData = aesdecrypt(k1.toHex(), combo)

    return decryptedData
  }
  return { alg: alg, enc: 'A256GCM', decrypt }
}

export function aesEncrypter(publicKeyHex: string): Encrypter {
  const alg = 'A256GCMKW'
  //const keyLen = 256
  const crv = 'EC'
  async function encrypt(
    cleartext: Uint8Array,
    protectedHeader: Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _aad?: Uint8Array
  ): Promise<EncryptionResult> {
    return new Promise<EncryptionResult>((resolve) => {
      // we won't want alg to be set to dir from xc20pDirEncrypter
      //Object.assign(protectedHeader, { alg: undefined })

      const p1 = esicsPublicKey.fromHex(publicKeyHex)

      const ciphertext = aesencrypt(p1.toHex(), Buffer.from(cleartext))

      const iv = ciphertext.slice(0, 16)
      const tag = ciphertext.slice(16, 32)
      const ciphered = ciphertext.slice(32)

      const protHeader = u8a.toString(
        u8a.fromString(JSON.stringify(Object.assign({ alg }, protectedHeader, { enc: 'A256GCM' }))),
        'base64url'
      )

      const recipient = {
        // eslint-disable-next-line @typescript-eslint/camelcase
        encrypted_key: 'key',
        header: {
          epk: { kty: 'EC', crv, x: u8a.toString(p1.compressed, 'base64url') },
          alg: 'A256GCMKW',
          iv: u8a.toString(iv, 'base64url'),
          tag: u8a.toString(tag, 'base64url'),
        },
      } as Recipient

      const result = {
        recipient: recipient,
        protectedHeader: protHeader,
        ciphertext: ciphered,
        tag: tag,
        iv: iv,
      } as EncryptionResult

      resolve(result)
    })
  }
  return { alg, enc: 'A256GCM', encrypt }
}

const didMethods: HandlerMethods<Context> = {
  did_authenticate: async ({ did, secretKey }, params: AuthParams) => {
    const response = await sign(
      {
        did,
        aud: params.aud,
        nonce: params.nonce,
        paths: params.paths,
        exp: Math.floor(Date.now() / 1000) + 600, // expires 10 min from now
      },
      did,
      secretKey
    )
    return toGeneralJWS(response)
  },
  did_createJWS: async ({ did, secretKey }, params: CreateJWSParams) => {
    const requestDid = params.did.split('#')[0]
    if (requestDid !== did) throw new RPCError(4100, `Unknown DID: ${did}`)
    const jws = await sign(params.payload, did, secretKey, params.protected)
    return { jws: toGeneralJWS(jws) }
  },
  did_createJWE: async (_, params: CreateJWEParams) => {
    if (params.recipients.length > 0) {
      const encrypter = aesEncrypter(params.recipients[0])
      const encrypters: Array<Encrypter> = [encrypter]

      const jwe = await createJWE(params.cleartext, encrypters, params.protectedHeader, params.aad)

      return { jwe: jwe }
    }

    throw new RPCError(4100, 'did_createJWE')
  },
  did_decryptJWE: async ({ secretKey }, params: DecryptJWEParams) => {
    const decrypter = aesDecrypter(secretKey)
    try {
      const bytes = await decryptJWE(params.jwe, decrypter)
      return { cleartext: u8a.toString(bytes, B64) }
    } catch (e) {
      throw new RPCError(-32000, (e as Error).message)
    }
  },
}

export class Secp256k1Provider implements RPCConnection {
  protected _handle: (_msg: RPCRequest) => Promise<RPCResponse | null>

  constructor(secretKey: Uint8Array) {
    const did = encodeDID(secretKey)
    const handler: RequestHandler = createHandler<Context>(didMethods)
    this._handle = (msg: RPCRequest): Promise<RPCResponse<any, any> | null> => {
      return handler({ did, secretKey }, msg)
    }
  }

  public get isDidProvider(): boolean {
    return true
  }

  public async send(msg: RPCRequest): Promise<RPCResponse | null> {
    return await this._handle(msg)
  }
}
