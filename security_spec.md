# Security Specification — KH Engenharia Área do Cliente

## 1. Data Invariants

1. **Strict PII Isolation (`/users/{userId}`)**: A user profile contains PII (`email`, `phone`, `city`). Only the profile owner (`request.auth.uid == userId`) or a verified KH Engenharia admin may read or list it. Users cannot inject `role` or `isAdmin` fields.
2. **Verified Identity Mandate**: All non-admin writes and client project reads require `request.auth != null && request.auth.token.email_verified == true`.
3. **Admin Authority (`/admins/{userId}` + Bootstrapped Verified Email)**: Only a verified admin (`exists(/databases/$(database)/documents/admins/$(request.auth.uid))` or `request.auth.token.email == 'kaiolegal0@gmail.com' && request.auth.token.email_verified == true`) can create/edit/delete projects, milestones, or engineer-authored deliverables, and manage service request statuses.
4. **Master Gate Relational Integrity**: Subcollection records (`milestones`, `documents`, `messages`) cannot exist without an existing parent `/projects/{projectId}`. Every subcollection write verifies parent existence via `get()` and enforces `incoming().projectId == projectId` and `incoming().clientEmail == parent.data.clientEmail`.
5. **Query-Safe List Isolation**: Every `allow list` rule enforces `isAdmin() || (isVerifiedUser() && resource.data.clientEmail == request.auth.token.email)` (or `resource.data.clientUid == request.auth.uid`) with zero `get()`/`exists()` calls inside `allow list`.
6. **Temporal & Immutable Integrity**: All `createdAt` fields must equal `request.time` on create and remain immutable on update; `updatedAt` must equal `request.time` on create and update.
7. **Terminal State Locking**: Once a `ServiceRequest` reaches `convertida` or `arquivada`, or a `Project` reaches `concluido`, non-admin updates are blocked.
8. **Strict Key Allowlisting & Volumetric Limits**: Every entity enforces `hasAll` + `hasOnly` on create, `affectedKeys().hasOnly(...)` on update, `isValidId()` on single-document path IDs, and explicit `.size()` bounds on every string field.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return `PERMISSION_DENIED`)

1. **P1 — Self-Assigned Admin Escalation**: Authenticated client attempts `setDoc(/users/{uid}, { ..., isAdmin: true, role: 'admin' })`. Blocked by `hasOnly` schema check.
2. **P2 — Cross-User PII Read**: Client A attempts `getDoc(/users/{clientB_uid})`. Blocked by owner/admin isolation.
3. **P3 — Email Spoofing Without Verification**: Attacker with `email: 'kaiolegal0@gmail.com'` and `email_verified: false` attempts to list `/projects`. Blocked by `request.auth.token.email_verified == true`.
4. **P4 — Unauthorized Project Creation**: Client attempts `setDoc(/projects/proj-999, validProjectPayload)`. Blocked because only `isAdmin()` may create projects.
5. **P5 — Client Cross-Project Snooping**: Client A (`a@example.com`) attempts `getDoc(/projects/proj-client-b)` belonging to `b@example.com`. Blocked by email/UID ownership check.
6. **P6 — Orphaned Milestone Injection**: Attacker attempts `setDoc(/projects/nonexistent-id/milestones/m1, payload)`. Blocked by Master Gate `exists()`/`get()` on parent project and admin check.
7. **P7 — Engineer Impersonation in Messages**: Assigned client attempts `setDoc(/projects/{pid}/messages/msg1, { ..., authorRole: 'engenheiro' })`. Blocked by role verification (`authorRole == 'cliente'` for non-admin).
8. **P8 — Shadow Field Injection on Update**: Client updates their profile with `{ displayName: 'Novo', updatedAt: serverTimestamp(), verifiedVIP: true }`. Blocked by `affectedKeys().hasOnly(...)` and `isValidUserProfile()`.
9. **P9 — Client Timestamp Backdating**: Client creates a service request with `createdAt: Timestamp(2020-01-01)`. Blocked by `incoming().createdAt == request.time`.
10. **P10 — Resource Exhaustion / ID Poisoning**: Client attempts to create `/serviceRequests/${'a'.repeat(500)}` or injects a 50KB `description` string. Blocked by `isValidId()` (`<= 128` + regex) and `.size() <= 2000`.
11. **P11 — Terminal State Tampering**: Client attempts to modify a `ServiceRequest` whose status is already `'convertida'` or submit a document to a `'concluido'` project. Blocked by terminal state lock.
12. **P12 — Blanket Collection Scraping**: Client attempts `getDocs(collection(db, 'projects'))` without filtering to their own `clientEmail`. Blocked by rule-side `allow list` checking `resource.data.clientEmail == request.auth.token.email`.
