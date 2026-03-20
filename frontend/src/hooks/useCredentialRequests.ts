// localStorage-based credential request tracking
// Shape: { id, requesterAddress, issuerAddress, issuerName, credentialType, status, createdAt }

export type RequestStatus = "pending" | "approved" | "rejected"

export interface CredentialRequest {
  id: string
  requesterAddress: string
  issuerAddress: string
  issuerName: string
  credentialType: string
  status: RequestStatus
  createdAt: string
}

const KEY = "btc-vault-requests"

export function getRequests(): CredentialRequest[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]")
  } catch {
    return []
  }
}

export function saveRequest(req: Omit<CredentialRequest, "id" | "createdAt" | "status">): CredentialRequest {
  const requests = getRequests()
  const newReq: CredentialRequest = {
    ...req,
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
  }
  localStorage.setItem(KEY, JSON.stringify([...requests, newReq]))
  return newReq
}

export function updateRequestStatus(id: string, status: RequestStatus) {
  const requests = getRequests()
  const updated = requests.map(r => r.id === id ? { ...r, status } : r)
  localStorage.setItem(KEY, JSON.stringify(updated))
}

// Requests sent by this address (user view)
export function getOutgoingRequests(address: string): CredentialRequest[] {
  return getRequests().filter(r => r.requesterAddress === address)
}

// Requests received by this address (issuer view)
export function getIncomingRequests(address: string): CredentialRequest[] {
  return getRequests().filter(r => r.issuerAddress === address)
}
