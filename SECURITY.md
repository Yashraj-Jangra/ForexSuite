# Security Policy

At **VaultBill**, data security, tenant isolation, and regulatory compliance are fundamental to our architecture. This policy outlines our security practices, supported versions, and procedure for reporting vulnerabilities.

---

## 🛡️ Supported Versions

We provide security patches and updates for the following versions:

| Version          | Supported          | Notes                                           |
| ---------------- | ------------------ | ----------------------------------------------- |
| `2.x.x` (Latest) | :white_check_mark: | Active production releases on `master` / `main` |
| `1.x.x`          | :x:                | Legacy release branch (upgrade recommended)     |
| `< 1.0.0`        | :x:                | Experimental development builds                 |

---

## 🔒 Architectural Security Guarantees

### 1. Physical Multi-Tenant Schema Isolation

VaultBill isolates tenant data using dynamic PostgreSQL schemas (`tenant_{uuid}`).

- Tenant queries execute within a connection whose search path is strictly bound to that tenant's schema:
  ```sql
  SET search_path TO "tenant_<uuid>", public;
  ```
- This prevents accidental cross-tenant data leaks that can occur with shared-table row-level filtering.

### 2. Cookie & Session Security

- User sessions are authenticated using **Better Auth** with cryptographically signed tokens.
- Cookies are set with `HttpOnly`, `SameSite=Lax` (or `Strict`), and `Secure` (in production) flags, mitigating cross-site scripting (XSS) and token theft.

### 3. MinIO S3 Object Security

- Documents (invoice PDFs, FIRC certificates, LUT documentation) are organized under tenant-scoped path prefixes: `tenants/{tenantId}/...`.
- Client downloads utilize time-limited pre-signed URLs. Public read access to storage buckets is disabled by default.

### 4. Zero Hardcoded Credentials

- All secrets, database connection strings, and API keys are validated at startup using Zod schemas (`packages/config/src/index.ts`). If required secrets are missing or malformed, the process terminates immediately rather than failing open.

---

## 🚨 Reporting a Vulnerability

We deeply appreciate the efforts of security researchers and open-source contributors in identifying security vulnerabilities.

### Disclosure Process

1. **Do not create public GitHub issues or discussions** for suspected security vulnerabilities.
2. Email your findings confidentially to **security@vaultbill.app** or submit a report via [GitHub Private Vulnerability Reporting](https://github.com/yashraj/vaultbill/security/advisories/new).
3. Please include:
   - A detailed description of the vulnerability and attack vector.
   - Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
   - Potential impact on tenant isolation, data confidentiality, or financial calculations.
   - Any suggested mitigations or patches.

### Our Commitment

- **Acknowledgement**: We will acknowledge receipt of your report within **48 hours**.
- **Triage**: Our engineering team will assess and validate the severity within **5 business days**.
- **Remediation**: Valid vulnerabilities will be patched and released within **14 calendar days**, followed by coordinated public disclosure and credit to the researcher.

---

## ⚙️ Safe Deployment Recommendations

When deploying VaultBill to production:

1. **Generate Strong Secrets**: Set `BETTER_AUTH_SECRET` to a random, cryptographically secure string of at least 32 characters.
2. **Reverse Proxy SSL**: Always terminate HTTPS using Caddy (as provided in `docker/compose.prod.yml`) or an equivalent reverse proxy with HSTS enabled.
3. **Internal Network Isolation**: Ensure PostgreSQL (port 5434 in dev) and Redis (port 6380) are only accessible over internal private networks, never exposed directly to the public internet.
4. **Regular Backups**: Utilize our automated backup routines to snapshot PostgreSQL schemas and upload encrypted pg_dumps to off-site storage.
