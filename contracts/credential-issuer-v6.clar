;; credential-issuer.clar
;; Manages trusted issuers who can issue and revoke verifiable credentials
;; Part of Bitcoin Identity Vault - Self-Sovereign Identity on Stacks

;; ============================================================
;; Constants
;; ============================================================
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u200))
(define-constant ERR-ALREADY-REGISTERED (err u201))
(define-constant ERR-NOT-REGISTERED (err u202))
(define-constant ERR-ISSUER-NOT-VERIFIED (err u203))
(define-constant ERR-ISSUER-SUSPENDED (err u204))
(define-constant ERR-CREDENTIAL-NOT-FOUND (err u205))
(define-constant ERR-ALREADY-REVOKED (err u206))
(define-constant ERR-INVALID-INPUT (err u207))
(define-constant ERR-BATCH-TOO-LARGE (err u208))
(define-constant ERR-REQUEST-NOT-FOUND (err u209))
(define-constant ERR-REQUEST-ALREADY-EXISTS (err u210))

;; Maximum batch size for bulk issuance
(define-constant MAX-BATCH-SIZE u25)

;; ============================================================
;; Data Variables
;; ============================================================
(define-data-var total-issuers uint u0)
(define-data-var total-issued uint u0)
(define-data-var total-revoked uint u0)

;; List of all registered issuer addresses (for pagination)
(define-data-var issuer-addresses (list 1000 principal) (list))

;; ============================================================
;; Data Maps
;; ============================================================

;; Issuer registry
(define-map issuers
  principal
  {
    name: (string-ascii 128),
    issuer-type: (string-ascii 32),
    registered-at: uint,
    credentials-issued: uint,
    is-verified: bool,
    is-suspended: bool,
    metadata-url: (string-ascii 256)
  }
)

;; Issued credentials tracking
(define-map issued-credentials
  { issuer: principal, credential-hash: (buff 32) }
  {
    recipient: principal,
    credential-type: (string-ascii 32),
    issued-at: uint,
    is-revoked: bool,
    revoked-at: uint,
    revocation-reason: (string-ascii 256)
  }
)

;; Admin list for governance
(define-map admins principal bool)

;; Credential requests from users to issuers
(define-map credential-requests
  { requester: principal, issuer: principal }
  {
    credential-type: (string-ascii 32),
    status: (string-ascii 16),  ;; "pending" | "approved" | "rejected"
    requested-at: uint
  }
)

;; Index: requests sent by a requester (outgoing)
(define-map requester-requests
  principal
  (list 100 principal)  ;; list of issuer addresses
)

;; Index: requests received by an issuer (incoming)
(define-map issuer-requests
  principal
  (list 100 principal)  ;; list of requester addresses
)

;; Index: credentials received by a recipient
(define-map recipient-credentials
  principal
  (list 100 { issuer: principal, credential-hash: (buff 32) })
)

;; ============================================================
;; Initialize
;; ============================================================

;; Set contract owner as initial admin
(map-set admins CONTRACT-OWNER true)

;; ============================================================
;; Private Functions
;; ============================================================

(define-private (is-admin (caller principal))
  (default-to false (map-get? admins caller))
)

(define-private (is-verified-issuer (issuer-addr principal))
  (match (map-get? issuers issuer-addr)
    issuer (and (get is-verified issuer) (not (get is-suspended issuer)))
    false
  )
)

;; ============================================================
;; Read-Only Functions
;; ============================================================

;; Get issuer profile
(define-read-only (get-issuer (issuer-addr principal))
  (map-get? issuers issuer-addr)
)

;; Check if address is a verified issuer
(define-read-only (check-issuer-status (issuer-addr principal))
  (match (map-get? issuers issuer-addr)
    issuer (ok {
      is-registered: true,
      is-verified: (get is-verified issuer),
      is-suspended: (get is-suspended issuer),
      credentials-issued: (get credentials-issued issuer)
    })
    (ok {
      is-registered: false,
      is-verified: false,
      is-suspended: false,
      credentials-issued: u0
    })
  )
)

;; Get issued credential details
(define-read-only (get-issued-credential (issuer-addr principal) (credential-hash (buff 32)))
  (map-get? issued-credentials { issuer: issuer-addr, credential-hash: credential-hash })
)

;; Get a credential request
(define-read-only (get-credential-request (requester principal) (issuer principal))
  (map-get? credential-requests { requester: requester, issuer: issuer })
)

;; Get all issuers a requester has sent requests to
(define-read-only (get-outgoing-requests (requester principal))
  (default-to (list) (map-get? requester-requests requester))
)

;; Get all requesters who sent requests to an issuer
(define-read-only (get-incoming-requests (issuer principal))
  (default-to (list) (map-get? issuer-requests issuer))
)

;; Get all credentials received by a recipient
(define-read-only (get-recipient-credentials (recipient principal))
  (default-to (list) (map-get? recipient-credentials recipient))
)

;; Get stats
(define-read-only (get-stats)
  {
    total-issuers: (var-get total-issuers),
    total-issued: (var-get total-issued),
    total-revoked: (var-get total-revoked)
  }
)

;; Get paginated list of issuer addresses
(define-read-only (get-issuer-addresses (offset uint) (limit uint))
  (let
    (
      (all-addresses (var-get issuer-addresses))
      (total (len all-addresses))
      (end (if (<= (+ offset limit) total) (+ offset limit) total))
    )
    (ok {
      addresses: (if (< offset total)
        (unwrap-panic (slice? all-addresses offset end))
        (list)),
      total: total,
      offset: offset,
      limit: limit
    })
  )
)

;; ============================================================
;; Public Functions
;; ============================================================

;; Register as an issuer (pending verification)
(define-public (register-issuer
  (name (string-ascii 128))
  (issuer-type (string-ascii 32))
  (metadata-url (string-ascii 256))
)
  (let
    (
      (caller tx-sender)
    )
    ;; Validate inputs
    (asserts! (> (len name) u0) ERR-INVALID-INPUT)
    
    ;; Check not already registered
    (asserts! (is-none (map-get? issuers caller)) ERR-ALREADY-REGISTERED)
    
    ;; Register issuer (unverified by default)
    (map-set issuers caller {
      name: name,
      issuer-type: issuer-type,
      registered-at: stacks-block-height,
      credentials-issued: u0,
      is-verified: false,
      is-suspended: false,
      metadata-url: metadata-url
    })
    
    ;; Add to issuer list
    (var-set issuer-addresses 
      (unwrap! (as-max-len? (append (var-get issuer-addresses) caller) u1000) ERR-INVALID-INPUT))
    
    ;; Increment counter
    (var-set total-issuers (+ (var-get total-issuers) u1))
    
    (print { event: "issuer-registered", issuer: caller, name: name, issuer-type: issuer-type })
    (ok true)
  )
)

;; Issue a credential to a recipient
(define-public (issue-credential
  (recipient principal)
  (credential-hash (buff 32))
  (credential-type (string-ascii 32))
  (expires-at uint)
  (metadata-url (string-ascii 256))
)
  (let
    (
      (issuer tx-sender)
      (issuer-profile (unwrap! (map-get? issuers issuer) ERR-NOT-REGISTERED))
    )
    ;; Verify issuer is verified and not suspended
    (asserts! (get is-verified issuer-profile) ERR-ISSUER-NOT-VERIFIED)
    (asserts! (not (get is-suspended issuer-profile)) ERR-ISSUER-SUSPENDED)
    
    ;; Validate hash
    (asserts! (> (len credential-hash) u0) ERR-INVALID-INPUT)
    
    ;; Track issued credential
    (map-set issued-credentials
      { issuer: issuer, credential-hash: credential-hash }
      {
        recipient: recipient,
        credential-type: credential-type,
        issued-at: stacks-block-height,
        is-revoked: false,
        revoked-at: u0,
        revocation-reason: ""
      }
    )
    
    ;; Update issuer stats
    (map-set issuers issuer
      (merge issuer-profile { credentials-issued: (+ (get credentials-issued issuer-profile) u1) })
    )
    
    ;; Add to recipient index
    (map-set recipient-credentials recipient
      (unwrap! (as-max-len? 
        (append (default-to (list) (map-get? recipient-credentials recipient)) { issuer: issuer, credential-hash: credential-hash })
        u100) ERR-INVALID-INPUT)
    )

    ;; Increment total
    (var-set total-issued (+ (var-get total-issued) u1))
    
    (print { event: "credential-issued", issuer: issuer, recipient: recipient, credential-hash: credential-hash, credential-type: credential-type })
    (ok true)
  )
)

;; Revoke a credential
(define-public (revoke-credential
  (credential-hash (buff 32))
  (reason (string-ascii 256))
)
  (let
    (
      (issuer tx-sender)
      (cred (unwrap! (map-get? issued-credentials { issuer: issuer, credential-hash: credential-hash }) ERR-CREDENTIAL-NOT-FOUND))
    )
    ;; Check not already revoked
    (asserts! (not (get is-revoked cred)) ERR-ALREADY-REVOKED)
    
    ;; Revoke credential
    (map-set issued-credentials
      { issuer: issuer, credential-hash: credential-hash }
      (merge cred {
        is-revoked: true,
        revoked-at: stacks-block-height,
        revocation-reason: reason
      })
    )
    
    ;; Increment revoked count
    (var-set total-revoked (+ (var-get total-revoked) u1))
    
    (print { event: "credential-revoked", issuer: issuer, credential-hash: credential-hash, reason: reason })
    (ok true)
  )
)

;; Request a credential from an issuer
(define-public (request-credential (issuer principal) (credential-type (string-ascii 32)))
  (let ((caller tx-sender))
    (asserts! (is-some (map-get? issuers issuer)) ERR-NOT-REGISTERED)
    (asserts! (is-none (map-get? credential-requests { requester: caller, issuer: issuer })) ERR-REQUEST-ALREADY-EXISTS)
    (map-set credential-requests
      { requester: caller, issuer: issuer }
      { credential-type: credential-type, status: "pending", requested-at: stacks-block-height }
    )
    ;; Update outgoing index for requester
    (map-set requester-requests caller
      (unwrap! (as-max-len? (append (default-to (list) (map-get? requester-requests caller)) issuer) u100) ERR-INVALID-INPUT)
    )
    ;; Update incoming index for issuer
    (map-set issuer-requests issuer
      (unwrap! (as-max-len? (append (default-to (list) (map-get? issuer-requests issuer)) caller) u100) ERR-INVALID-INPUT)
    )
    (print { event: "credential-requested", requester: caller, issuer: issuer, credential-type: credential-type })
    (ok true)
  )
)

;; Approve a credential request (issuer only)
(define-public (approve-request (requester principal))
  (let
    ((caller tx-sender)
     (req (unwrap! (map-get? credential-requests { requester: requester, issuer: caller }) ERR-REQUEST-NOT-FOUND)))
    (map-set credential-requests
      { requester: requester, issuer: caller }
      (merge req { status: "approved" })
    )
    (print { event: "request-approved", requester: requester, issuer: caller })
    (ok true)
  )
)

;; Reject a credential request (issuer only)
(define-public (reject-request (requester principal))
  (let
    ((caller tx-sender)
     (req (unwrap! (map-get? credential-requests { requester: requester, issuer: caller }) ERR-REQUEST-NOT-FOUND)))
    (map-set credential-requests
      { requester: requester, issuer: caller }
      (merge req { status: "rejected" })
    )
    (print { event: "request-rejected", requester: requester, issuer: caller })
    (ok true)
  )
)

;; ============================================================
;; Admin Functions
;; ============================================================

;; Verify an issuer (admin only)
(define-public (verify-issuer (issuer-addr principal))
  (let
    (
      (caller tx-sender)
      (issuer-profile (unwrap! (map-get? issuers issuer-addr) ERR-NOT-REGISTERED))
    )
    ;; Only admins can verify
    (asserts! (is-admin caller) ERR-NOT-AUTHORIZED)
    
    ;; Update verification status
    (map-set issuers issuer-addr
      (merge issuer-profile { is-verified: true })
    )
    
    (print { event: "issuer-verified", issuer: issuer-addr, verified-by: caller })
    (ok true)
  )
)

;; Suspend an issuer (admin only)
(define-public (suspend-issuer (issuer-addr principal))
  (let
    (
      (caller tx-sender)
      (issuer-profile (unwrap! (map-get? issuers issuer-addr) ERR-NOT-REGISTERED))
    )
    ;; Only admins can suspend
    (asserts! (is-admin caller) ERR-NOT-AUTHORIZED)
    
    ;; Suspend issuer
    (map-set issuers issuer-addr
      (merge issuer-profile { is-suspended: true })
    )
    
    (print { event: "issuer-suspended", issuer: issuer-addr, suspended-by: caller })
    (ok true)
  )
)

;; Unsuspend an issuer (admin only)
(define-public (unsuspend-issuer (issuer-addr principal))
  (let
    (
      (caller tx-sender)
      (issuer-profile (unwrap! (map-get? issuers issuer-addr) ERR-NOT-REGISTERED))
    )
    ;; Only admins can unsuspend
    (asserts! (is-admin caller) ERR-NOT-AUTHORIZED)
    
    ;; Unsuspend issuer
    (map-set issuers issuer-addr
      (merge issuer-profile { is-suspended: false })
    )
    
    (print { event: "issuer-unsuspended", issuer: issuer-addr, unsuspended-by: caller })
    (ok true)
  )
)

;; Add admin (owner only)
(define-public (add-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (map-set admins new-admin true)
    (print { event: "admin-added", admin: new-admin })
    (ok true)
  )
)

;; Remove admin (owner only)
(define-public (remove-admin (admin-addr principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (not (is-eq admin-addr CONTRACT-OWNER)) ERR-NOT-AUTHORIZED)
    (map-set admins admin-addr false)
    (print { event: "admin-removed", admin: admin-addr })
    (ok true)
  )
)
