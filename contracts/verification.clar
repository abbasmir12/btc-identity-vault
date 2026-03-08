;; verification.clar
;; On-chain verification logic for Bitcoin Identity Vault
;; Allows verifiers to request and verify credentials with post-conditions
;; Part of Bitcoin Identity Vault - Self-Sovereign Identity on Stacks

;; ============================================================
;; Constants
;; ============================================================
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u300))
(define-constant ERR-REQUEST-NOT-FOUND (err u301))
(define-constant ERR-REQUEST-EXPIRED (err u302))
(define-constant ERR-ALREADY-RESPONDED (err u303))
(define-constant ERR-INVALID-INPUT (err u304))
(define-constant ERR-CREDENTIAL-INVALID (err u305))
(define-constant ERR-VERIFICATION-FAILED (err u306))

;; Request expiry in blocks (~24 hours at 10 min/block)
(define-constant REQUEST-EXPIRY u144)

;; ============================================================
;; Data Variables
;; ============================================================
(define-data-var total-requests uint u0)
(define-data-var total-verifications uint u0)
(define-data-var request-nonce uint u0)

;; ============================================================
;; Data Maps
;; ============================================================

;; Verification requests
(define-map verification-requests
  uint
  {
    verifier: principal,
    credential-owner: principal,
    credential-hash: (buff 32),
    requested-fields: (string-ascii 256),
    status: (string-ascii 16),
    created-at: uint,
    responded-at: uint,
    verification-result: bool
  }
)

;; Verification records (permanent on-chain proof)
(define-map verification-records
  { credential-hash: (buff 32), verifier: principal, verification-id: uint }
  {
    verified-at: uint,
    fields-verified: (string-ascii 256),
    is-valid: bool
  }
)

;; Verifier profiles
(define-map verifiers
  principal
  {
    name: (string-ascii 128),
    verifier-type: (string-ascii 32),
    total-verifications: uint,
    registered-at: uint,
    is-active: bool
  }
)

;; ============================================================
;; Read-Only Functions
;; ============================================================

;; Get verification request
(define-read-only (get-request (request-id uint))
  (map-get? verification-requests request-id)
)

;; Get verification record
(define-read-only (get-verification-record (credential-hash (buff 32)) (verifier principal) (verification-id uint))
  (map-get? verification-records { credential-hash: credential-hash, verifier: verifier, verification-id: verification-id })
)

;; Get verifier profile
(define-read-only (get-verifier (verifier-addr principal))
  (map-get? verifiers verifier-addr)
)

;; Get verification stats
(define-read-only (get-verification-stats)
  {
    total-requests: (var-get total-requests),
    total-verifications: (var-get total-verifications)
  }
)

;; Get current nonce (for request IDs)
(define-read-only (get-current-nonce)
  (var-get request-nonce)
)

;; Quick verify: check if a credential hash is valid for an owner
;; This is the main function verifiers call
(define-read-only (quick-verify (owner principal) (credential-hash (buff 32)))
  (let
    (
      (cred-check (contract-call? .identity-registry verify-credential owner credential-hash))
    )
    cred-check
  )
)

;; ============================================================
;; Public Functions
;; ============================================================

;; Register as a verifier
(define-public (register-verifier
  (name (string-ascii 128))
  (verifier-type (string-ascii 32))
)
  (let
    (
      (caller tx-sender)
    )
    (asserts! (> (len name) u0) ERR-INVALID-INPUT)
    
    (map-set verifiers caller {
      name: name,
      verifier-type: verifier-type,
      total-verifications: u0,
      registered-at: block-height,
      is-active: true
    })
    
    (print { event: "verifier-registered", verifier: caller, name: name })
    (ok true)
  )
)

;; Create a verification request
(define-public (create-request
  (credential-owner principal)
  (credential-hash (buff 32))
  (requested-fields (string-ascii 256))
)
  (let
    (
      (caller tx-sender)
      (new-id (var-get request-nonce))
    )
    ;; Validate
    (asserts! (> (len credential-hash) u0) ERR-INVALID-INPUT)
    
    ;; Create request
    (map-set verification-requests new-id {
      verifier: caller,
      credential-owner: credential-owner,
      credential-hash: credential-hash,
      requested-fields: requested-fields,
      status: "pending",
      created-at: block-height,
      responded-at: u0,
      verification-result: false
    })
    
    ;; Increment counters
    (var-set request-nonce (+ new-id u1))
    (var-set total-requests (+ (var-get total-requests) u1))
    
    (print { event: "verification-requested", request-id: new-id, verifier: caller, owner: credential-owner, credential-hash: credential-hash })
    (ok new-id)
  )
)

;; Approve a verification request (credential owner responds)
(define-public (approve-request (request-id uint))
  (let
    (
      (caller tx-sender)
      (request (unwrap! (map-get? verification-requests request-id) ERR-REQUEST-NOT-FOUND))
    )
    ;; Only credential owner can approve
    (asserts! (is-eq caller (get credential-owner request)) ERR-NOT-AUTHORIZED)
    
    ;; Check request is still pending
    (asserts! (is-eq (get status request) "pending") ERR-ALREADY-RESPONDED)
    
    ;; Check not expired
    (asserts! (< (- block-height (get created-at request)) REQUEST-EXPIRY) ERR-REQUEST-EXPIRED)
    
    ;; Update request status
    (map-set verification-requests request-id
      (merge request {
        status: "approved",
        responded-at: block-height,
        verification-result: true
      })
    )
    
    ;; Create permanent verification record
    (map-set verification-records
      { credential-hash: (get credential-hash request), verifier: (get verifier request), verification-id: request-id }
      {
        verified-at: block-height,
        fields-verified: (get requested-fields request),
        is-valid: true
      }
    )
    
    ;; Update verifier stats
    (match (map-get? verifiers (get verifier request))
      verifier-profile
        (map-set verifiers (get verifier request)
          (merge verifier-profile { total-verifications: (+ (get total-verifications verifier-profile) u1) })
        )
      true
    )
    
    ;; Increment verification count
    (var-set total-verifications (+ (var-get total-verifications) u1))
    
    (print { event: "request-approved", request-id: request-id, owner: caller, verifier: (get verifier request) })
    (ok true)
  )
)

;; Deny a verification request
(define-public (deny-request (request-id uint))
  (let
    (
      (caller tx-sender)
      (request (unwrap! (map-get? verification-requests request-id) ERR-REQUEST-NOT-FOUND))
    )
    ;; Only credential owner can deny
    (asserts! (is-eq caller (get credential-owner request)) ERR-NOT-AUTHORIZED)
    
    ;; Check request is still pending
    (asserts! (is-eq (get status request) "pending") ERR-ALREADY-RESPONDED)
    
    ;; Update request status
    (map-set verification-requests request-id
      (merge request {
        status: "denied",
        responded-at: block-height,
        verification-result: false
      })
    )
    
    (print { event: "request-denied", request-id: request-id, owner: caller, verifier: (get verifier request) })
    (ok true)
  )
)

;; Perform instant verification (no request needed, verifier checks directly)
;; Uses post-conditions: verifier pays a small fee, gets result
(define-public (instant-verify
  (owner principal)
  (credential-hash (buff 32))
)
  (let
    (
      (caller tx-sender)
      (new-id (var-get request-nonce))
      (cred-result (unwrap! (contract-call? .identity-registry verify-credential owner credential-hash) ERR-CREDENTIAL-INVALID))
    )
    ;; Check if credential is valid
    (asserts! (get is-valid cred-result) ERR-VERIFICATION-FAILED)
    
    ;; Check if verifier has access
    (asserts! (contract-call? .identity-registry has-access credential-hash caller) ERR-NOT-AUTHORIZED)
    
    ;; Record the verification
    (map-set verification-requests new-id {
      verifier: caller,
      credential-owner: owner,
      credential-hash: credential-hash,
      requested-fields: "instant-verify",
      status: "verified",
      created-at: block-height,
      responded-at: block-height,
      verification-result: true
    })
    
    ;; Create permanent record
    (map-set verification-records
      { credential-hash: credential-hash, verifier: caller, verification-id: new-id }
      {
        verified-at: block-height,
        fields-verified: "instant-verify",
        is-valid: true
      }
    )
    
    ;; Update counters
    (var-set request-nonce (+ new-id u1))
    (var-set total-requests (+ (var-get total-requests) u1))
    (var-set total-verifications (+ (var-get total-verifications) u1))
    
    ;; Update verifier stats
    (match (map-get? verifiers caller)
      verifier-profile
        (map-set verifiers caller
          (merge verifier-profile { total-verifications: (+ (get total-verifications verifier-profile) u1) })
        )
      true
    )
    
    (print { 
      event: "instant-verification",
      verification-id: new-id,
      verifier: caller,
      owner: owner,
      credential-type: (get credential-type cred-result),
      issuer: (get issuer cred-result),
      is-valid: true
    })
    
    (ok {
      verification-id: new-id,
      credential-type: (get credential-type cred-result),
      issuer: (get issuer cred-result),
      issued-at: (get issued-at cred-result),
      is-valid: true
    })
  )
)
