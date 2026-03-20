;; identity-registry.clar
;; Maps BNS (.btc) names to credential hashes and manages user identity profiles
;; Part of Bitcoin Identity Vault - Self-Sovereign Identity on Stacks

;; ============================================================
;; Constants
;; ============================================================
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-ALREADY-REGISTERED (err u101))
(define-constant ERR-NOT-REGISTERED (err u102))
(define-constant ERR-CREDENTIAL-EXISTS (err u103))
(define-constant ERR-CREDENTIAL-NOT-FOUND (err u104))
(define-constant ERR-INVALID-HASH (err u105))
(define-constant ERR-MAX-CREDENTIALS (err u106))

;; Maximum credentials per identity
(define-constant MAX-CREDENTIALS u50)

;; ============================================================
;; Data Variables
;; ============================================================
(define-data-var total-identities uint u0)
(define-data-var total-credentials uint u0)

;; ============================================================
;; Data Maps
;; ============================================================

;; Core identity registry: maps principal to identity profile
(define-map identities
  principal
  {
    btc-name: (string-ascii 64),
    registered-at: uint,
    credential-count: uint,
    is-active: bool
  }
)

;; Maps credential hash to credential metadata
(define-map credentials
  { owner: principal, credential-hash: (buff 32) }
  {
    credential-type: (string-ascii 32),
    issuer: principal,
    issued-at: uint,
    expires-at: uint,
    is-revoked: bool,
    metadata-url: (string-ascii 256)
  }
)

;; Index: maps owner to list of credential hashes (up to MAX-CREDENTIALS)
(define-map credential-index
  principal
  (list 50 (buff 32))
)

;; Access control: who can view which credentials
(define-map credential-access
  { credential-hash: (buff 32), viewer: principal }
  {
    granted-at: uint,
    expires-at: uint,
    fields-shared: (string-ascii 256),
    is-active: bool
  }
)

;; ============================================================
;; Read-Only Functions
;; ============================================================

;; Get identity profile
(define-read-only (get-identity (owner principal))
  (map-get? identities owner)
)

;; Check if identity is registered
(define-read-only (is-registered (owner principal))
  (is-some (map-get? identities owner))
)

;; Get credential by hash
(define-read-only (get-credential (owner principal) (credential-hash (buff 32)))
  (map-get? credentials { owner: owner, credential-hash: credential-hash })
)

;; Get all credential hashes for an owner
(define-read-only (get-credential-hashes (owner principal))
  (default-to (list) (map-get? credential-index owner))
)

;; Check credential access
(define-read-only (get-access (credential-hash (buff 32)) (viewer principal))
  (map-get? credential-access { credential-hash: credential-hash, viewer: viewer })
)

;; Check if viewer has active access to a credential
(define-read-only (has-access (credential-hash (buff 32)) (viewer principal))
  (match (map-get? credential-access { credential-hash: credential-hash, viewer: viewer })
    access (and (get is-active access)
               (or (is-eq (get expires-at access) u0)
                   (> (get expires-at access) stacks-block-height)))
    false
  )
)

;; Get total identities registered
(define-read-only (get-total-identities)
  (var-get total-identities)
)

;; Get total credentials issued
(define-read-only (get-total-credentials)
  (var-get total-credentials)
)

;; Verify a credential exists and is valid
(define-read-only (verify-credential (owner principal) (credential-hash (buff 32)))
  (match (map-get? credentials { owner: owner, credential-hash: credential-hash })
    cred (ok {
      is-valid: (and (not (get is-revoked cred))
                     (or (is-eq (get expires-at cred) u0)
                         (> (get expires-at cred) stacks-block-height))),
      credential-type: (get credential-type cred),
      issuer: (get issuer cred),
      issued-at: (get issued-at cred),
      is-revoked: (get is-revoked cred)
    })
    ERR-CREDENTIAL-NOT-FOUND
  )
)

;; ============================================================
;; Public Functions
;; ============================================================

;; Register a new identity
(define-public (register-identity (btc-name (string-ascii 64)))
  (let
    (
      (caller tx-sender)
    )
    ;; Check not already registered
    (asserts! (not (is-registered caller)) ERR-ALREADY-REGISTERED)
    
    ;; Create identity
    (map-set identities caller {
      btc-name: btc-name,
      registered-at: stacks-block-height,
      credential-count: u0,
      is-active: true
    })
    
    ;; Initialize empty credential index
    (map-set credential-index caller (list))
    
    ;; Increment total
    (var-set total-identities (+ (var-get total-identities) u1))
    
    (print { event: "identity-registered", owner: caller, btc-name: btc-name })
    (ok true)
  )
)

;; Add a credential (called by issuer contracts or authorized issuers)
(define-public (add-credential 
  (owner principal)
  (credential-hash (buff 32))
  (credential-type (string-ascii 32))
  (expires-at uint)
  (metadata-url (string-ascii 256))
)
  (let
    (
      (issuer tx-sender)
      (current-hashes (default-to (list) (map-get? credential-index owner)))
      (identity (unwrap! (map-get? identities owner) ERR-NOT-REGISTERED))
    )
    ;; Validate hash is not empty
    (asserts! (> (len credential-hash) u0) ERR-INVALID-HASH)
    
    ;; Check credential doesn't already exist
    (asserts! (is-none (map-get? credentials { owner: owner, credential-hash: credential-hash })) ERR-CREDENTIAL-EXISTS)
    
    ;; Check max credentials not exceeded
    (asserts! (< (len current-hashes) MAX-CREDENTIALS) ERR-MAX-CREDENTIALS)
    
    ;; Store credential
    (map-set credentials
      { owner: owner, credential-hash: credential-hash }
      {
        credential-type: credential-type,
        issuer: issuer,
        issued-at: stacks-block-height,
        expires-at: expires-at,
        is-revoked: false,
        metadata-url: metadata-url
      }
    )
    
    ;; Update credential index
    (map-set credential-index owner (unwrap! (as-max-len? (append current-hashes credential-hash) u50) ERR-MAX-CREDENTIALS))
    
    ;; Update identity credential count
    (map-set identities owner (merge identity { credential-count: (+ (get credential-count identity) u1) }))
    
    ;; Increment total
    (var-set total-credentials (+ (var-get total-credentials) u1))
    
    (print { event: "credential-added", owner: owner, issuer: issuer, credential-hash: credential-hash, credential-type: credential-type })
    (ok true)
  )
)

;; Grant access to a credential
(define-public (grant-access
  (credential-hash (buff 32))
  (viewer principal)
  (expires-at uint)
  (fields-shared (string-ascii 256))
)
  (let
    (
      (caller tx-sender)
    )
    ;; Verify caller owns this credential
    (asserts! (is-some (map-get? credentials { owner: caller, credential-hash: credential-hash })) ERR-CREDENTIAL-NOT-FOUND)
    
    ;; Set access
    (map-set credential-access
      { credential-hash: credential-hash, viewer: viewer }
      {
        granted-at: stacks-block-height,
        expires-at: expires-at,
        fields-shared: fields-shared,
        is-active: true
      }
    )
    
    (print { event: "access-granted", owner: caller, viewer: viewer, credential-hash: credential-hash })
    (ok true)
  )
)

;; Revoke access to a credential
(define-public (revoke-access (credential-hash (buff 32)) (viewer principal))
  (let
    (
      (caller tx-sender)
      (access (unwrap! (map-get? credential-access { credential-hash: credential-hash, viewer: viewer }) ERR-CREDENTIAL-NOT-FOUND))
    )
    ;; Verify caller owns this credential
    (asserts! (is-some (map-get? credentials { owner: caller, credential-hash: credential-hash })) ERR-NOT-AUTHORIZED)
    
    ;; Revoke access
    (map-set credential-access
      { credential-hash: credential-hash, viewer: viewer }
      (merge access { is-active: false })
    )
    
    (print { event: "access-revoked", owner: caller, viewer: viewer, credential-hash: credential-hash })
    (ok true)
  )
)

;; Deactivate identity (soft delete)
(define-public (deactivate-identity)
  (let
    (
      (caller tx-sender)
      (identity (unwrap! (map-get? identities caller) ERR-NOT-REGISTERED))
    )
    (map-set identities caller (merge identity { is-active: false }))
    
    (print { event: "identity-deactivated", owner: caller })
    (ok true)
  )
)
