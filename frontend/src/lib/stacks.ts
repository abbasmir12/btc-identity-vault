import { connect, disconnect, isConnected, getLocalStorage, request } from '@stacks/connect';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';
import {
  fetchCallReadOnlyFunction,
  cvToJSON,
  Cl,
} from '@stacks/transactions';

// Network configuration — use proxy in dev to avoid CORS
const isDev = import.meta.env.DEV
const NETWORK = import.meta.env.VITE_NETWORK === 'mainnet'
  ? STACKS_MAINNET
  : isDev
    ? { ...STACKS_TESTNET, coreApiUrl: '/api/stacks' }
    : STACKS_TESTNET;

// Contract addresses (will be set after deployment)
export const CONTRACTS = {
  IDENTITY_REGISTRY: import.meta.env.VITE_IDENTITY_REGISTRY_CONTRACT || '',
  CREDENTIAL_ISSUER: import.meta.env.VITE_CREDENTIAL_ISSUER_CONTRACT || '',
  VERIFICATION: import.meta.env.VITE_VERIFICATION_CONTRACT || '',
};

// Connect wallet (v8 API)
export const connectWallet = async (): Promise<void> => {
  await connect();
};

// Check if signed in
export const isSignedIn = (): boolean => {
  return isConnected();
};

// Get user data from local storage
export const getUserData = () => {
  if (!isConnected()) return null;
  return getLocalStorage();
};

// Disconnect wallet
export const disconnectWallet = () => {
  disconnect();
};

// Get STX address
export const getAddress = (): string | null => {
  const data = getLocalStorage();
  return data?.addresses?.stx?.[0]?.address || null;
};

// ============================================================
// Read-Only Functions
// ============================================================

// Get identity profile
export const getIdentity = async (address: string) => {
  try {
    const [contractAddress, contractName] = CONTRACTS.IDENTITY_REGISTRY.split('.');
    const result = await fetchCallReadOnlyFunction({
      network: NETWORK,
      contractAddress,
      contractName,
      functionName: 'get-identity',
      functionArgs: [Cl.principal(address)],
      senderAddress: address,
    });
    return cvToJSON(result);
  } catch (error) {
    console.error('Error getting identity:', error);
    return null;
  }
};

// Get credential hashes for an owner
export const getCredentialHashes = async (address: string) => {
  try {
    const [contractAddress, contractName] = CONTRACTS.IDENTITY_REGISTRY.split('.');
    const result = await fetchCallReadOnlyFunction({
      network: NETWORK,
      contractAddress,
      contractName,
      functionName: 'get-credential-hashes',
      functionArgs: [Cl.principal(address)],
      senderAddress: address,
    });
    return cvToJSON(result);
  } catch (error) {
    console.error('Error getting credential hashes:', error);
    return [];
  }
};

// Get credential details
export const getCredential = async (owner: string, credentialHash: string) => {
  try {
    const [contractAddress, contractName] = CONTRACTS.IDENTITY_REGISTRY.split('.');
    const result = await fetchCallReadOnlyFunction({
      network: NETWORK,
      contractAddress,
      contractName,
      functionName: 'get-credential',
      functionArgs: [
        Cl.principal(owner),
        Cl.buffer(Uint8Array.from(credentialHash.match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16)))),
      ],
      senderAddress: owner,
    });
    return cvToJSON(result);
  } catch (error) {
    console.error('Error getting credential:', error);
    return null;
  }
};

// Verify credential (read-only check)
export const checkCredential = async (owner: string, credentialHash: string) => {
  try {
    const [contractAddress, contractName] = CONTRACTS.IDENTITY_REGISTRY.split('.');
    const result = await fetchCallReadOnlyFunction({
      network: NETWORK,
      contractAddress,
      contractName,
      functionName: 'verify-credential',
      functionArgs: [
        Cl.principal(owner),
        Cl.buffer(Uint8Array.from(credentialHash.match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16)))),
      ],
      senderAddress: owner,
    });
    return cvToJSON(result);
  } catch (error) {
    console.error('Error verifying credential:', error);
    return null;
  }
};

// ============================================================
// Write Functions (Transactions)
// ============================================================

// Register identity
export const registerIdentity = async (btcName: string) => {
  if (!isConnected()) throw new Error('Not authenticated');
  
  const [contractAddress, contractName] = CONTRACTS.IDENTITY_REGISTRY.split('.');
  
  const response = await request('stx_callContract', {
    contract: `${contractAddress}.${contractName}`,
    functionName: 'register-identity',
    functionArgs: [Cl.stringAscii(btcName)],
    network: import.meta.env.VITE_NETWORK === 'mainnet' ? 'mainnet' : 'testnet',
  });
  
  return response;
};

// Grant access to a credential
export const grantAccess = async (
  credentialHash: string,
  viewer: string,
  expiresAt: number,
  fieldsShared: string
) => {
  if (!isConnected()) throw new Error('Not authenticated');
  
  const [contractAddress, contractName] = CONTRACTS.IDENTITY_REGISTRY.split('.');
  
  const response = await request('stx_callContract', {
    contract: `${contractAddress}.${contractName}`,
    functionName: 'grant-access',
    functionArgs: [
      Cl.buffer(Uint8Array.from(credentialHash.match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16)))),
      Cl.principal(viewer),
      Cl.uint(expiresAt),
      Cl.stringAscii(fieldsShared),
    ],
    network: import.meta.env.VITE_NETWORK === 'mainnet' ? 'mainnet' : 'testnet',
  });
  
  return response;
};

// Revoke access to a credential
export const revokeAccess = async (credentialHash: string, viewer: string) => {
  if (!isConnected()) throw new Error('Not authenticated');
  
  const [contractAddress, contractName] = CONTRACTS.IDENTITY_REGISTRY.split('.');
  
  const response = await request('stx_callContract', {
    contract: `${contractAddress}.${contractName}`,
    functionName: 'revoke-access',
    functionArgs: [
      Cl.buffer(Uint8Array.from(credentialHash.match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16)))),
      Cl.principal(viewer),
    ],
    network: import.meta.env.VITE_NETWORK === 'mainnet' ? 'mainnet' : 'testnet',
  });
  
  return response;
};

// Revoke a credential (issuer only)
export const revokeCredential = async (credentialHash: string, reason: string) => {
  if (!isConnected()) throw new Error('Not authenticated');
  const [contractAddress, contractName] = CONTRACTS.CREDENTIAL_ISSUER.split('.');
  return await request('stx_callContract', {
    contract: `${contractAddress}.${contractName}`,
    functionName: 'revoke-credential',
    functionArgs: [
      Cl.buffer(Uint8Array.from(credentialHash.match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16)))),
      Cl.stringAscii(reason),
    ],
    network: import.meta.env.VITE_NETWORK === 'mainnet' ? 'mainnet' : 'testnet',
  });
};

// ============================================================
// Issuer Functions
// ============================================================

// Register as an issuer
export const registerIssuer = async (
  name: string,
  issuerType: string,
  metadataUrl: string
) => {
  if (!isConnected()) throw new Error('Not authenticated');
  
  const [contractAddress, contractName] = CONTRACTS.CREDENTIAL_ISSUER.split('.');
  
  const response = await request('stx_callContract', {
    contract: `${contractAddress}.${contractName}`,
    functionName: 'register-issuer',
    functionArgs: [
      Cl.stringAscii(name),
      Cl.stringAscii(issuerType),
      Cl.stringAscii(metadataUrl),
    ],
    network: import.meta.env.VITE_NETWORK === 'mainnet' ? 'mainnet' : 'testnet',
  });
  
  return response;
};

// Issue a credential
export const issueCredential = async (
  recipient: string,
  credentialHash: string,
  credentialType: string,
  expiresAt: number,
  metadataUrl: string
) => {
  if (!isConnected()) throw new Error('Not authenticated');
  
  const [contractAddress, contractName] = CONTRACTS.CREDENTIAL_ISSUER.split('.');
  const hashBytes = Uint8Array.from(credentialHash.match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16)))
  
  const response = await request('stx_callContract', {
    contract: `${contractAddress}.${contractName}`,
    functionName: 'issue-credential',
    functionArgs: [
      Cl.principal(recipient),
      Cl.buffer(hashBytes),
      Cl.stringAscii(credentialType),
      Cl.uint(expiresAt),
      Cl.stringAscii(metadataUrl),
    ],
    network: import.meta.env.VITE_NETWORK === 'mainnet' ? 'mainnet' : 'testnet',
  });
  
  return response;
};

// Get issuer profile
export const getIssuerProfile = async (issuerAddress: string) => {
  const [contractAddress, contractName] = CONTRACTS.CREDENTIAL_ISSUER.split('.');
  
  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: 'get-issuer',
    functionArgs: [Cl.principal(issuerAddress)],
    network: NETWORK,
    senderAddress: issuerAddress,
  });
  
  return cvToJSON(result);
};

// ============================================================
// Verification Functions
// ============================================================

// Verify a credential
export const verifyCredential = async (
  credentialHash: string,
  issuer: string
) => {
  // Pure read-only — no wallet needed
  return await getCredentialStatus(credentialHash, issuer);
};

// Get credential verification status
export const getCredentialStatus = async (
  credentialHash: string,
  issuer: string
) => {
  const [contractAddress, contractName] = CONTRACTS.CREDENTIAL_ISSUER.split('.');
  const cleanHash = credentialHash.replace(/^0x/, '')
  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: 'get-issued-credential',
    functionArgs: [
      Cl.principal(issuer),
      Cl.buffer(Uint8Array.from(cleanHash.match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16)))),
    ],
    network: NETWORK,
    senderAddress: issuer,
  });
  
  return cvToJSON(result);
};

// Get all issuers (read from contract stats and iterate)
export const getIssuers = async () => {
  try {
    const [contractAddress, contractName] = CONTRACTS.CREDENTIAL_ISSUER.split('.');
    
    // Get total issuers count
    const statsResult = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: 'get-stats',
      functionArgs: [],
      network: NETWORK,
      senderAddress: contractAddress,
    });
    
    return cvToJSON(statsResult);
  } catch (error) {
    console.error('Error fetching issuers:', error);
    return null;
  }
};

// Get paginated issuer addresses
export const getIssuerAddresses = async (offset: number = 0, limit: number = 20) => {
  try {
    const [contractAddress, contractName] = CONTRACTS.CREDENTIAL_ISSUER.split('.');
    
    const result = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: 'get-issuer-addresses',
      functionArgs: [Cl.uint(offset), Cl.uint(limit)],
      network: NETWORK,
      senderAddress: contractAddress,
    });
    
    return cvToJSON(result);
  } catch (error) {
    console.error('Error fetching issuer addresses:', error);
    return null;
  }
};

// Get issuer details by address
export const getIssuerDetails = async (issuerAddress: string) => {
  try {
    const [contractAddress, contractName] = CONTRACTS.CREDENTIAL_ISSUER.split('.');
    
    const result = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: 'get-issuer',
      functionArgs: [Cl.principal(issuerAddress)],
      network: NETWORK,
      senderAddress: contractAddress,
    });
    
    return cvToJSON(result);
  } catch (error) {
    console.error('Error fetching issuer details:', error);
    return null;
  }
};

// Get verification requests for an address
export const getVerificationRequests = async (userAddress: string) => {
  try {
    // This would require a contract function to track verification requests
    // For now, return empty array as contract doesn't have this yet
    console.log('Fetching verification requests for:', userAddress)
    return [];
  } catch (error) {
    console.error('Error fetching verification requests:', error);
    return [];
  }
};

// Get all issuers a requester has sent requests to (outgoing)
export const getOutgoingRequests = async (requesterAddress: string) => {
  const [contractAddress, contractName] = CONTRACTS.CREDENTIAL_ISSUER.split('.');
  const result = await fetchCallReadOnlyFunction({
    contractAddress, contractName,
    functionName: 'get-outgoing-requests',
    functionArgs: [Cl.principal(requesterAddress)],
    network: NETWORK,
    senderAddress: contractAddress,
  });
  return cvToJSON(result);
};

// Get all requesters who sent requests to an issuer (incoming)
export const getIncomingRequests = async (issuerAddress: string) => {
  const [contractAddress, contractName] = CONTRACTS.CREDENTIAL_ISSUER.split('.');
  const result = await fetchCallReadOnlyFunction({
    contractAddress, contractName,
    functionName: 'get-incoming-requests',
    functionArgs: [Cl.principal(issuerAddress)],
    network: NETWORK,
    senderAddress: contractAddress,
  });
  return cvToJSON(result);
};
// Get all credentials received by a recipient (on-chain index)
export const getRecipientCredentials = async (recipientAddress: string) => {
  const [contractAddress, contractName] = CONTRACTS.CREDENTIAL_ISSUER.split('.');
  const result = await fetchCallReadOnlyFunction({
    contractAddress, contractName,
    functionName: 'get-recipient-credentials',
    functionArgs: [Cl.principal(recipientAddress)],
    network: NETWORK,
    senderAddress: contractAddress,
  });
  return cvToJSON(result);
};

// Get a specific issued credential details
export const getIssuedCredentialDetail = async (issuerAddress: string, credentialHash: Uint8Array) => {
  const [contractAddress, contractName] = CONTRACTS.CREDENTIAL_ISSUER.split('.');
  const result = await fetchCallReadOnlyFunction({
    contractAddress, contractName,
    functionName: 'get-issued-credential',
    functionArgs: [Cl.principal(issuerAddress), Cl.buffer(credentialHash)],
    network: NETWORK,
    senderAddress: contractAddress,
  });
  return cvToJSON(result);
};

export const requestCredential = async (issuerAddress: string, credentialType: string) => {
  if (!isConnected()) throw new Error('Not authenticated');
  const [contractAddress, contractName] = CONTRACTS.CREDENTIAL_ISSUER.split('.');
  return await request('stx_callContract', {
    contract: `${contractAddress}.${contractName}`,
    functionName: 'request-credential',
    functionArgs: [Cl.principal(issuerAddress), Cl.stringAscii(credentialType)],
    network: import.meta.env.VITE_NETWORK === 'mainnet' ? 'mainnet' : 'testnet',
  });
};

// Approve a credential request (issuer only, on-chain)
export const approveRequest = async (requesterAddress: string) => {
  if (!isConnected()) throw new Error('Not authenticated');
  const [contractAddress, contractName] = CONTRACTS.CREDENTIAL_ISSUER.split('.');
  return await request('stx_callContract', {
    contract: `${contractAddress}.${contractName}`,
    functionName: 'approve-request',
    functionArgs: [Cl.principal(requesterAddress)],
    network: import.meta.env.VITE_NETWORK === 'mainnet' ? 'mainnet' : 'testnet',
  });
};

// Reject a credential request (issuer only, on-chain)
export const rejectRequest = async (requesterAddress: string) => {
  if (!isConnected()) throw new Error('Not authenticated');
  const [contractAddress, contractName] = CONTRACTS.CREDENTIAL_ISSUER.split('.');
  return await request('stx_callContract', {
    contract: `${contractAddress}.${contractName}`,
    functionName: 'reject-request',
    functionArgs: [Cl.principal(requesterAddress)],
    network: import.meta.env.VITE_NETWORK === 'mainnet' ? 'mainnet' : 'testnet',
  });
};

// Get a credential request status (on-chain)
export const getCredentialRequest = async (requesterAddress: string, issuerAddress: string) => {
  const [contractAddress, contractName] = CONTRACTS.CREDENTIAL_ISSUER.split('.');
  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: 'get-credential-request',
    functionArgs: [Cl.principal(requesterAddress), Cl.principal(issuerAddress)],
    network: NETWORK,
    senderAddress: contractAddress,
  });
  return cvToJSON(result);
};
