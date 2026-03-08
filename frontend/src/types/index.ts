export type CredentialType = 
  | "education"
  | "employment"
  | "identity"
  | "certification"
  | "healthcare"
  | "financial"

export type CredentialStatus = "active" | "revoked" | "expired" | "pending"

export interface Credential {
  id: string
  type: CredentialType
  title: string
  issuer: string
  issuerAddress: string
  issuedDate: string
  expiryDate?: string
  status: CredentialStatus
  description: string
  hash: string
  fields: Record<string, string>
  sharedWith: SharedAccess[]
}

export interface SharedAccess {
  id: string
  verifierName: string
  verifierAddress: string
  sharedDate: string
  expiresAt?: string
  fieldsShared: string[]
}

export interface UserProfile {
  btcName: string
  address: string
  stxAddress: string
  credentialCount: number
  verificationCount: number
  joinedDate: string
}

export interface Issuer {
  id: string
  name: string
  address: string
  type: string
  credentialsIssued: number
  verified: boolean
  logo?: string
}

export interface VerificationRequest {
  id: string
  credentialId: string
  verifierName: string
  verifierAddress: string
  requestedFields: string[]
  status: "pending" | "approved" | "rejected"
  requestDate: string
}

export interface ActivityItem {
  id: string
  type: "issued" | "shared" | "verified" | "revoked"
  title: string
  description: string
  timestamp: string
  credentialId?: string
}
