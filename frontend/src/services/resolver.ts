import crypto from 'crypto';

export type AccountProofData = {
    // e.g. "Awesome App (v0.0)" - A human readable string to identify your application during signing
    appIdentifier: string;  

    // e.g. "75f8587e5bd5f9dcc9909d0dae1f0ac5814458b2ae129620502cb936fde7120a" - minimum 32-byte random nonce as hex string
    nonce: string;          
}
  
type AccountProofDataResolver = () => Promise<AccountProofData | null>;

export const serviceName = 'BatchTransferTools'

export const localResolver: AccountProofDataResolver = async () => {
    return {
        appIdentifier: serviceName,
        nonce: crypto.randomBytes(32).toString('hex'),
    };
}