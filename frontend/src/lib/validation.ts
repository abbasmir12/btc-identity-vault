// Input validation utilities

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent XSS
    .trim()
}

export function validateBTCName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "BTC name is required" }
  }
  
  if (name.length < 3) {
    return { valid: false, error: "BTC name must be at least 3 characters" }
  }
  
  if (name.length > 40) {
    return { valid: false, error: "BTC name must be less than 40 characters" }
  }
  
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    return { valid: false, error: "BTC name can only contain letters, numbers, dots, hyphens, and underscores" }
  }
  
  return { valid: true }
}

export function validateOrganizationName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Organization name is required" }
  }
  
  if (name.length < 2) {
    return { valid: false, error: "Organization name must be at least 2 characters" }
  }
  
  if (name.length > 100) {
    return { valid: false, error: "Organization name must be less than 100 characters" }
  }
  
  return { valid: true }
}

export function validateURL(url: string): { valid: boolean; error?: string } {
  if (!url || url.trim().length === 0) {
    return { valid: true } // Optional field
  }
  
  try {
    new URL(url)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { valid: false, error: "URL must start with http:// or https://" }
    }
    return { valid: true }
  } catch {
    return { valid: false, error: "Invalid URL format" }
  }
}

export function validateCredentialTitle(title: string): { valid: boolean; error?: string } {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: "Credential title is required" }
  }
  
  if (title.length < 3) {
    return { valid: false, error: "Title must be at least 3 characters" }
  }
  
  if (title.length > 200) {
    return { valid: false, error: "Title must be less than 200 characters" }
  }
  
  return { valid: true }
}

export function validateStacksAddress(address: string): { valid: boolean; error?: string } {
  if (!address || address.trim().length === 0) {
    return { valid: false, error: "Address is required" }
  }
  
  // Stacks addresses start with SP or ST (mainnet/testnet)
  if (!address.startsWith('SP') && !address.startsWith('ST')) {
    return { valid: false, error: "Invalid Stacks address format" }
  }
  
  if (address.length !== 41) {
    return { valid: false, error: "Stacks address must be 41 characters" }
  }
  
  return { valid: true }
}

export function validateCredentialHash(hash: string): { valid: boolean; error?: string } {
  if (!hash || hash.trim().length === 0) {
    return { valid: false, error: "Credential hash is required" }
  }
  
  // SHA-256 hash is 64 hex characters
  if (!/^[a-fA-F0-9]{64}$/.test(hash)) {
    return { valid: false, error: "Invalid credential hash format (must be 64 hex characters)" }
  }
  
  return { valid: true }
}
