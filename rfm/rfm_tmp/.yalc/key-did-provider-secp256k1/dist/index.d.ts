import { Encrypter } from 'did-jwt';
import { Decrypter } from 'did-jwt';
import { RPCConnection, RPCRequest, RPCResponse } from 'rpc-utils';
export declare function encodeDID(secretKey: Uint8Array): string;
export interface PublicKey {
    id: string;
    type: string;
    controller: string;
    ethereumAddress?: string;
    publicKeyBase64?: string;
    publicKeyBase58?: string;
    publicKeyHex?: string;
    publicKeyPem?: string;
}
export interface CreateJWEParams {
    cleartext: Uint8Array;
    recipients: Array<string>;
    protectedHeader?: Record<string, any>;
    aad?: Uint8Array;
}
interface JWSSignature {
    protected: string;
    signature: string;
}
export interface GeneralJWS {
    payload: string;
    signatures: Array<JWSSignature>;
}
export declare function aesDecrypter(secretKey: Uint8Array): Decrypter;
export declare function aesEncrypter(publicKeyHex: string): Encrypter;
export declare class Secp256k1Provider implements RPCConnection {
    protected _handle: (_msg: RPCRequest) => Promise<RPCResponse | null>;
    constructor(secretKey: Uint8Array);
    get isDidProvider(): boolean;
    send(msg: RPCRequest): Promise<RPCResponse | null>;
}
export {};
