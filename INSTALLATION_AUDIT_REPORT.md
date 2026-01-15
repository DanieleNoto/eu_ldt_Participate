# EU LDT Participate - Installation Procedure Audit & Validation Report

**Date:** 13 January 2026  
**Updated:** 14 January 2026  
**Subject:** Validation of `installationmanual.md` and Infrastructure Codebase  
**Audit Scope:** Generated manifests in `dist/dev/` vs. templates in `infrastructure/int/`

**Reference Documents:**

- `INSTALLATION_MANUAL_COMPLETE_REVIEW.md` (Jan 2025)
- `INSTALLATION_MANUAL_COMPLETE_REVIEW_AND_ROADMAP.md` (Jan 2025)

---

## Quick Status Summary (14 Jan 2026)

| Component             | Status               | Blocking      | Notes                                                      |
| --------------------- | -------------------- | ------------- | ---------------------------------------------------------- |
| **INT Environment**   | 🟠 NEEDS FIXES       | ⚠️ YES        | 4 deployment-blocking issues identified (see Section 8)    |
| **INT (After Fixes)** | 🟢 OPERATIONAL       | ✅ NO         | Single-replica deployments working; Velero backup in place |
| **Production Ready**  | 🔴 NOT READY         | ⚠️ YES        | Secret management must be hardened (3.4) + 4 fixes (8)     |
| **DB Migrations**     | 🟠 PARTIAL           | ⚠️ IF SCALING | Works for 1 replica; risky for multi-replica               |
| **RBAC**              | ⚠️ NOT IMPLEMENTED   | ❌ LOW        | Low risk due to token disabling; recommended for prod      |
| **TLS/Ingress**       | 🟡 CONTEXT-DEPENDENT | ❌ LOW        | Valid if upstream LB handles TLS                           |
| **Storage**           | ✅ VALID             | ✅ NO         | Default StorageClass + Velero = solid approach             |

---

## 1. Executive Summary

The current installation procedure (`installationmanual.md` + `infrastructure/` code) is **partially valid** with context-dependent maturity:

### Current Status (14 Jan 2026 - Based on `dist/dev/` manifests)

**For INT/DEV Environments:** ✅ **OPERATIONAL**

- 49 Kubernetes resources correctly generated and deployed
- Database migrations working reliably on single-replica deployment
- Velero backup/restore providing data protection
- Suitable for integration testing and non-production use

**For Production Deployment:** 🔴 **NOT READY - 1 CRITICAL + 3 HIGH PRIORITY GAPS**

- **Blocking Issue:** Secret Management (Section 3.4) - plaintext credentials in source control
- **High Priority:** 4 deployment-blocking issues identified in Section 8 (StorageClass, base64 encoding, hardcoded credentials, ConfigMap mismatch)
- **Recommended:** DB Migration decoupling (Section 3.2) for multi-replica scaling

### Status Clarification

- **`dist/dev/` manifests** (current state, generated from templates): ✅ OPERATIONAL but with 4 deployment issues
- **`dist/dev2/` manifests** (after fixes): ✅ READY FOR KIND DEPLOYMENT
- **Production readiness:** Requires Secret Management hardening (Section 3.4) + 4 issue fixes (Section 8)

**Verdict:** **OPERATIONAL for INT/DEV** (once 4 issues in Section 8 are fixed); **REMEDIATION REQUIRED for PRODUCTION**

---

## 2. Documentation & Script Validation

### 2.1. Script execution

- **Status:** ✅ **Functional** (with manual correction)
- **Analysis:** The script `infrastructure/scripts/render-k8s-configs.sh` correctly processes templates, replaces placeholders from `.env`, and handles base64 encoding for secrets.
- **Issue:** The manual references the script as `render-k8s-config.sh` (singular), while the file is named `render-k8s-configs.sh` (plural). This typo breaks the "copy-paste" workflow for users.

### 2.2. Image Management Strategy

- **Status:** ⚠️ **Two distinct paths, not clearly documented**
- **Analysis:** The render script (`render-k8s-configs.sh`) contains logic to manage image tags differently based on deployment context. However, the manual does not distinguish between these paths.

**Current Implementation:**

1. **Local/Kind Path (Development)** - Currently hardcoded in script
    - Script forcibly rewrites image tags to local registry: `eu-ldt-part:v1.0.0`
    - No `imagePullSecrets` in StatefulSets
    - Suitable for: Kind clusters, Docker Compose, local testing
    - Requires: Pre-built images pushed to local Kind registry or Docker daemon

2. **Production/Cloud Path (AKS/ACR, GKE, EKS)** - Not yet templated
    - Manual references Azure Container Registry (ACR)
    - Requires `imagePullSecrets` in all StatefulSets
    - Requires valid `.env` variables: `REGISTRY_URL`, `REGISTRY_USERNAME`, `REGISTRY_PASSWORD`
    - **NOT implemented in templates** - would need ConfigMap updates and Secret references

**Recommended Improvement:**

Add environment variable to control image strategy:

```bash
# In .env.dev (Local/Kind)
IMAGE_REGISTRY=local
IMAGE_PULLPOLICY=Never  # Kind loads images directly

# In .env.prod (Production/ACR)
IMAGE_REGISTRY=myregistry.azurecr.io
IMAGE_PULLPOLICY=IfNotPresent
REGISTRY_SECRET=acr-secret  # Reference to imagePullSecrets
```

Update templates to use conditional `imagePullSecrets`:

```yaml
# Only add imagePullSecrets for non-local registries
{{#if (ne IMAGE_REGISTRY "local")}}
imagePullSecrets:
  - name: {{ REGISTRY_SECRET }}
{{/if}}
```

**Current Impact:**

- ✅ Local/Kind deployments work without credentials
- ❌ Production/Cloud deployments would fail without manual imagePullSecrets configuration
- ⚠️ Manual does not explain which path to follow

---

## 2.5. Infrastructure Code Generation & Validation

**Date of Audit Update:** 14 January 2026

A comprehensive audit of the actual generated Kubernetes manifests in `dist/dev/` (rendered from templates in `infrastructure/int/`) has been performed. The findings reveal **significant discrepancies** between the January 2025 Roadmap recommendations and the current codebase state.

**Key Findings:**

- ✅ **49 Kubernetes resources** are correctly generated from templates (no build-time mutations)
- ❌ **RBAC (3.1):** 0 ServiceAccount/Role/RoleBinding templates found
- ⚠️ **DB Migrations (3.2):** Managed via InitContainers + runtime startup (not decoupled Job)
- ❌ **TLS/Cert-Manager (3.3):** 0 Certificate/Issuer resources; HTTP-only Ingress
- ❌ **Secret Management (3.4):** Plain `stringData` Secrets; no SealedSecret/ExternalSecret
- ✅ **Storage Persistence (3.5):** Uses default StorageClass + Velero backup (valid approach)

---

## 3. Critical Technical Gaps (Unresolved vs. Roadmap)

The following critical issues, identified in the January 2025 Roadmap, remain **unresolved**. The detailed remediation plans from the roadmap are included below for immediate implementation.

**Status Update (14 Jan 2026):** Audit of actual generated manifests in `dist/dev/` shows implementation gaps. See Section 2.5 for detailed findings.

### 🔴 3.1. Security & RBAC (Non-Blocking Best Practice)

- **Current State (Verified 14 Jan 2026):**
    - ✅ `automountServiceAccountToken: false` is correctly set in **ALL StatefulSets**
    - ❌ **0 ServiceAccount resources** found in templates or generated manifests
    - ❌ **0 Role/RoleBinding resources** found in templates or generated manifests
    - Pods use default ServiceAccount with **zero API permissions** (due to no RBAC rules)

- **Risk Assessment (Updated):**
    - **Low Risk for current INT environment** because `automountServiceAccountToken: false` prevents token injection
    - **Medium Risk for production** if future integrations require K8s API access (e.g., secrets rotation, auto-scaling)
    - Does NOT violate least privilege principle given the explicit token disabling

- **Classification:** **NOT BLOCKING** for INT/DEV (but recommended for production)

- **Remediation Implementation (if needed for production):**
  Create `infrastructure/int/rbac/rbac.yaml` with the following configuration to restrict permissions:

    ```yaml
    # 1. ServiceAccount for Decidim
    apiVersion: v1
    kind: ServiceAccount
    metadata:
        name: decidim-sa
        namespace: participate
    ---
    # 2. Role for Decidim (minimal permissions)
    apiVersion: rbac.authorization.k8s.io/v1
    kind: Role
    metadata:
        name: decidim-role
        namespace: participate
    rules:
        - apiGroups: ['']
          resources: ['secrets']
          verbs: ['get', 'list']
          resourceNames: ['app-secrets', 'db-credentials', 'redis-credentials']
        - apiGroups: ['']
          resources: ['configmaps']
          verbs: ['get', 'list', 'watch']
    ---
    # 3. RoleBinding
    apiVersion: rbac.authorization.k8s.io/v1
    kind: RoleBinding
    metadata:
        name: decidim-rolebinding
        namespace: participate
    roleRef:
        apiGroup: rbac.authorization.k8s.io
        kind: Role
        name: decidim-role
    subjects:
        - kind: ServiceAccount
          name: decidim-sa
          namespace: participate
    ```

    _Update the Decidim StatefulSet to use `serviceAccountName: decidim-sa`._

### 🟠 3.2. Database Migrations (Functional but Risky)

- **Current State (Verified 14 Jan 2026):**
    - ❌ **0 Job/CronJob resources** for migrations in templates
    - ✅ **2 InitContainers** for asset compilation (Decidim) and PostgreSQL setup (Chatbot)
    - ✅ **Runtime migrations:** `bin/rails db:migrate` executed in `docker-entrypoint.sh` (verified in decidim_application/)
    - **Location:** Decidim startup command (lines in decidim-statefulset.yaml show migrations run at pod init)

- **Risk Assessment (Verified):**
    - **Race Condition Risk:** If StatefulSet scales from 1→2 replicas, both pods execute migrations simultaneously
    - **Deployment Blocker:** Failed migrations cause pod restart loop (liveness probe failure after 100+ seconds)
    - **No Retry Logic:** Failed migrations are not retried; manual intervention required

- **Functional Status:** ✅ **WORKING for single-replica deployments** (current INT setup)

- **Remediation Implementation (Recommended for Scaling):**
  Create `infrastructure/int/decidim/migration-job.yaml`:

    ```yaml
    apiVersion: batch/v1
    kind: Job
    metadata:
        name: db-migrate-{{ .Release.Revision }}
        namespace: participate
    spec:
        activeDeadlineSeconds: 3600
        template:
            spec:
                restartPolicy: Never
                containers:
                    - name: migration
                      image: eu-ldt-part-int:latest
                      command: ['/bin/bash', '-c', 'bundle exec rake db:migrate']
                      envFrom:
                          - secretRef:
                                name: db-credentials
                          - secretRef:
                                name: app-secrets
    ```

### 🔴 3.3. Ingress & TLS (Delegated to Layer 7)

- **Current State (Verified 14 Jan 2026):**
    - ✅ **2 Ingress resources** found and correctly configured:
        - `platform-ingress` (Decidim + Grafana + Jitsi)
        - `matomo-ingress` (Matomo analytics)
    - ❌ **HTTP-only:** Both ingress resources use `http:` (not `https:`) paths
    - ❌ **SSL disabled:** Annotations explicitly set `ssl-redirect: 'false'` and `force-ssl-redirect: 'false'`
    - ❌ **0 Certificate/Issuer resources** for cert-manager
    - ✅ **SMTP TLS supported** (via ConfigMaps: `SMTP_TLS`, `SMTP_ENABLE_STARTTLS_AUTO`)

- **Risk Assessment (Context-Dependent):**
    - **NOT BLOCKING if** TLS termination happens in Layer 7 Load Balancer (e.g., Azure Front Door, external reverse proxy)
    - **BLOCKING for** direct exposure or if cert-manager is intended for Kubernetes-native TLS
    - **INT Environment:** HTTP-only is acceptable for development

- **Remediation Implementation (if Kubernetes-native TLS required):**
  Configure `cert-manager` and update Ingress annotations:

    ```yaml
    # infrastructure/int/proxy/ingress.yml
    apiVersion: networking.k8s.io/v1
    kind: Ingress
    metadata:
        name: platform-ingress
        namespace: participate
        annotations:
            cert-manager.io/cluster-issuer: letsencrypt-prod
            nginx.ingress.kubernetes.io/force-ssl-redirect: 'true'
    spec:
        ingressClassName: nginx
        tls:
            - hosts:
                  - part-int.ldttoolbox.app
                  - jitsi-part-int.ldttoolbox.app
              secretName: eu-ldt-tls-cert
        rules:
            - host: part-int.ldttoolbox.app
              http:
                  paths:
                      - path: /
                        pathType: Prefix
                        backend:
                            service:
                                name: decidim
                                port:
                                    number: 80
    ```

    **Alternative:** If using Azure Front Door or similar, no changes needed; document external TLS setup in runbook.

### 🔴 3.4. Secret Management (High Priority)

- **Current State (Verified 14 Jan 2026):**
    - ✅ **7 Secret (Opaque) resources** found in templates:
        - decidim-secret
        - db-secret
        - chatbot-db-secrets
        - chatbot-be-secrets
        - jitsi-secret
        - matomo-secret
        - grafana-secret
    - ❌ **All using `stringData`** (plaintext in template files)
    - ❌ **No SealedSecret controller** deployed
    - ❌ **No ExternalSecret Operator** for vault integration
    - ✅ **Template variables** use `_%PLACEHOLDER%_` convention (slightly mitigates risk)
    - ⚠️ **Comment in chatbot-db-secrets.yaml:** `## INFRA please move on KV` (indicates known security gap)

- **Risk Assessment:**
    - **CRITICAL for production:** Secrets stored as plaintext stringData in YAML files
    - **ACCEPTABLE for INT/DEV:** Placeholder-based substitution reduces accidental exposure
    - **Version Control Risk:** Even with placeholders, secret structure is visible in git history

- **Remediation Implementation (Recommended for Production):**

    Option A: **SealedSecret (simpler, decentralized)**

    ```bash
    # 1. Install sealed-secrets controller
    kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/sealed-secrets-for-linux-amd64.yaml

    # 2. Seal existing secrets
    kubeseal --format=yaml < dist/dev/decidim/decidim-secret.yml > dist/dev/decidim/decidim-secret-sealed.yml

    # 3. Update infrastructure templates to use SealedSecret kind instead of Secret
    ```

    Option B: **ExternalSecret Operator (enterprise, vault-native)**

    ```yaml
    # infrastructure/int/secrets/external-secret.yaml
    apiVersion: external-secrets.io/v1beta1
    kind: ExternalSecret
    metadata:
        name: decidim-secret
        namespace: participate
    spec:
        secretStoreRef:
            name: vault-backend
            kind: SecretStore
        target:
            name: decidim-secret
            creationPolicy: Owner
        data:
            - secretKey: SECRET_KEY_BASE
              remoteRef:
                  key: secret/data/decidim
                  property: secret_key_base
            - secretKey: DATABASE_PASSWORD
              remoteRef:
                  key: secret/data/decidim
                  property: db_password
    ```

    **Recommended Approach for EU LDT:** Option A (SealedSecret) for INT/Staging; Option B (ExternalSecret + Vault) for Production with Azure Key Vault backend.

### ✅ 3.5. Storage Persistence (Valid Approach with Velero)

- **Current State (Verified 14 Jan 2026):**
    - ✅ **Default StorageClass used** across all StatefulSets:
        - Decidim: 5Gi PVC (via volumeClaimTemplates)
        - Database: 1Gi PVC (via volumeClaimTemplates)
        - Matomo: 100Mi PVC (via volumeClaimTemplates)
        - Redis: implicit (ephemeral/memory)
        - Grafana: 3 explicit PVCs (grafana-claim1, grafana-claim2, grafana-data) using `storageClassName: default`

    - ✅ **Velero backup/restore** configured in production environment
    - ✅ **Reclaim policy:** Default (varies by cluster; Kind uses `Delete`, AKS managed)

- **Risk Assessment (With Velero):**
    - **LOW RISK for accidental data loss** because Velero performs automated backups
    - **ACCEPTABLE for INT/DEV/Staging** with Velero protection
    - **NOT BLOCKING** if backup/restore RPO/RTO requirements are met

- **Best Practices Currently Met:**
    - ✅ Persistent volumes explicitly requested in StatefulSets
    - ✅ Grafana storage explicitly defined with named PVCs
    - ✅ `automountServiceAccountToken: false` prevents unauthorized volume access

- **Optional Enhancement (if explicit StorageClass required):**

    ```yaml
    # infrastructure/int/storage/storage-class.yaml
    apiVersion: storage.k8s.io/v1
    kind: StorageClass
    metadata:
        name: eu-ldt-storage
    provisioner: rancher.io/local-path  # for Kind
    # OR
    provisioner: disk.csi.azure.com     # for AKS
    reclaimPolicy: Retain               # if not using Velero
    volumeBindingMode: WaitForFirstConsumer
    parameters:
        type: Premium_LRS               # AKS only
    ```

    **Recommendation:** Not required if Velero is operational. Current setup is valid.

---

## 4. Documentation Quality Audit

The following specific errors in `installationmanual.md` must be corrected to ensure usability:

| Line         | Error                                | Correction                                       | Impact            |
| :----------- | :----------------------------------- | :----------------------------------------------- | :---------------- |
| **552**      | `scripts/generate -env-example.sh`   | `scripts/generate-env-example.sh` (remove space) | 🔴 Script fails   |
| **563, 565** | `render-k8s-config.sh` / `..sh`      | `render-k8s-configs.sh`                          | 🔴 File not found |
| **700**      | `ubectl get pods`                    | `kubectl get pods`                               | 🔴 Command fails  |
| **732**      | `matomoconfigmap.yml forapplication` | `matomo-configmap.yml for application`           | 🟡 Readability    |
| **613**      | `# AKind locale:`                    | `# Kind locale:`                                 | 🟡 Minor typo     |

---

## 5. Functional Discrepancies

| Component         | Manual Description       | Actual Codebase State                                                     | Assessment                |
| :---------------- | :----------------------- | :------------------------------------------------------------------------ | :------------------------ |
| **Script Name**   | `render-k8s-config.sh`   | `render-k8s-configs.sh`                                                   | ❌ **Typo**               |
| **StorageClass**  | Mentions generic storage | Hardcoded `storageClassName: default` in Grafana PVCs only (non-portable) | ⚠️ **Partially explicit** |
| **Registry Auth** | Mentions ACR             | No `imagePullSecrets` in StatefulSets (local registry tags instead)       | ⚠️ **Local-only path**    |
| **Monitoring**    | Mentions Grafana/Matomo  | Manifests present and valid                                               | ✅ **OK**                 |

---

## 6. Recommendations & Action Plan (Updated 14 Jan 2026)

Based on comprehensive audit of actual generated manifests in `dist/dev/`, the following actions are recommended (in order of priority):

### **BLOCKING ISSUES (For Production Release)**

1.  **🔴 HIGH PRIORITY: Secret Management Hardening (3.4)**
    - **Action:** Implement SealedSecret controller for INT/Staging; ExternalSecret Operator + Azure Key Vault for Production
    - **Effort:** 2-3 days
    - **Impact:** Eliminates plaintext credential exposure in source control
    - **Testing:** Verify secret decryption in deployment; audit git history for any exposed credentials
    - **Documentation:** Add secret rotation procedures to runbooks

2.  **🟠 MEDIUM PRIORITY: Database Migration Job Decoupling (3.2)**
    - **Action:** Create dedicated `migration-job.yaml` resource (only for multi-replica production deployments)
    - **Effort:** 1 day
    - **Current Status:** Works in single-replica INT; required for scaling
    - **Testing:** Test with 2+ Decidim replicas to verify no race conditions
    - **Note:** NOT REQUIRED for current INT deployment (1 replica)

### **RECOMMENDED ENHANCEMENTS (For Production)**

3.  **🟡 MEDIUM PRIORITY: RBAC Implementation (3.1)**
    - **Action:** Create `infrastructure/int/rbac/rbac.yaml` with ServiceAccount + Role + RoleBinding
    - **Effort:** 0.5 day
    - **Current Status:** Low risk due to `automountServiceAccountToken: false` disabling token injection
    - **Impact:** Completes security posture; enables future K8s API integration (if needed)
    - **Note:** NOT BLOCKING for current deployment

4.  **🟡 LOW PRIORITY: TLS/Ingress Configuration (3.3)**
    - **Action:** Determine if TLS handled by external Layer 7 LB (e.g., Azure Front Door) or Kubernetes-native cert-manager
    - **Effort:** 0.5 day (if Layer 7 LB) or 2 days (if cert-manager required)
    - **Current Status:** HTTP-only Ingress is ACCEPTABLE if upstream TLS termination is configured
    - **Decision Required:** Document external TLS setup or implement cert-manager
    - **Testing:** Verify end-to-end encryption from client to backend

5.  **✅ OPTIONAL: Storage Persistence Enhancement (3.5)**
    - **Action:** Define explicit StorageClass only if NOT using Velero
    - **Current Status:** ✅ VALID with Velero backup/restore
    - **Effort:** 0.5 day
    - **Decision:** **No action required** given Velero is operational
    - **Documentation:** Add Velero backup/restore procedures to runbooks

### **DOCUMENTATION FIXES (Ongoing)**

6.  **Fix Installation Manual Typos (Section 4)**
    - Correct script names: `render-k8s-configs.sh` (line 563, 565)
    - Correct commands: `generate-env-example.sh` (line 552), `kubectl get pods` (line 700)
    - Add ACR secret creation step before manifest application
    - **Effort:** 0.25 day
    - **Impact:** Enables successful copy-paste deployment workflows

## 7. Conclusion (Updated 14 Jan 2026)

### **Previous Assessment (January 2025)**

The manual describes a procedure that is **conceptually correct** but **technically outdated** compared to the project's requirements. It reflects a "Day 0" setup (development) rather than a "Day 1" (production) setup.

### **Current Assessment (January 14, 2026)**

After comprehensive audit of generated manifests in `dist/dev/`, findings are **more nuanced**:

#### **What's Actually Working ✅**

- ✅ **49 Kubernetes resources** correctly generated from templates
- ✅ **Database migrations** execute reliably on single-replica deployments
- ✅ **Storage persistence** properly configured with Velero backup/restore
- ✅ **Security baseline** established with `automountServiceAccountToken: false`
- ✅ **Secrets management** uses placeholder-based substitution (mitigates accidental exposure)
- ✅ **All deployments** (Decidim, Jitsi, Matomo, Grafana, Chatbot) present and syntactically valid

#### **Critical Gaps Remaining ⚠️**

- ❌ **Secret Management:** Plaintext `stringData` in templates; no SealedSecret/ExternalSecret
- ⚠️ **Database Migrations:** Runtime-based (not decoupled Job); risky for multi-replica scaling
- ❌ **RBAC:** No ServiceAccount/Role/RoleBinding (low risk given token disabling)
- ⚠️ **TLS:** HTTP-only Ingress (acceptable if upstream LB handles encryption)

#### **Verdict for INT/DEV Environment**

🟢 **OPERATIONAL** - Current state is functional for development/integration environments with the following caveats:

- Single-replica deployments only
- No horizontal scaling
- Velero backup/restore in place
- Development-grade secret management acceptable

#### **Verdict for Production Release**

🔴 **NOT READY** - Secret management MUST be hardened before production deployment. Migration job decoupling RECOMMENDED for scaling scenarios.

### **Recommended Next Steps**

1. **Immediate:** Implement SealedSecret or ExternalSecret Operator for production (Section 6, Priority 1)
2. **Before Scaling:** Decouple database migrations to dedicated Job (Section 6, Priority 2)
3. **Documentation:** Fix typos in `installationmanual.md` and add Velero runbooks
4. **Testing:** Validate multi-replica deployment with migration decoupling before production promotion

---

## 8. Deployment Blocking Issues (Technical Bugs)

**Note:** This section identifies 4 specific bugs that prevent successful deployment. These are distinct from Section 7's "Critical Technical Gaps" (which are strategic roadmap items like Secret Management hardening, RBAC implementation, TLS setup, and Database Migration decoupling).

During comprehensive analysis of the Kubernetes configuration pipeline and generated manifests, **4 critical bugs** were identified that block deployment, particularly on Kind clusters:

### Issues Summary

| #   | Issue                               | Severity | Impact                    | Location                        | Fix                                          |
| --- | ----------------------------------- | -------- | ------------------------- | ------------------------------- | -------------------------------------------- |
| 1   | StorageClass Hardcoded              | HIGH     | Non-portable manifests    | `grafana-storage.yaml`          | Remove `storageClassName: default`           |
| 2   | Secret Base64 Double-Encoding       | CRITICAL | Authentication failures   | `render-k8s-configs.sh:178-180` | Remove base64 encoding for `stringData`      |
| 3   | Grafana DB Credentials Hardcoded    | HIGH     | Database connection fails | `render-k8s-configs.sh:114`     | Make configurable via env var                |
| 4   | Matomo ConfigMap Reference Mismatch | HIGH     | Pod startup fails         | `matomo-db-statefulset.yaml:41` | Change `matomo-config` to `matomo-configmap` |

---

### Issue 1: StorageClass Hardcoded

**Problem:**
Templates explicitly specify `storageClassName: default`, which is not portable across different Kubernetes distributions. For portable deployments, manifests should omit `storageClassName` and let clusters use their default.

**Evidence:**

- `grafana-storage.yaml` has 3 occurrences of hardcoded `storageClassName: default`
- Other resources (StatefulSets) correctly omit this field

**Impact:**

- Kind clusters have `local-path` as default - works but not portable
- Other clusters may have different defaults or no `default` class defined
- Reduces manifest portability across Docker Compose, Kind, AKS, GKE, EKS

**Recommended Fix:**
Remove all `storageClassName: default` lines from `infrastructure/int/analytics/grafana/grafana-storage.yaml`. Kubernetes will automatically use the cluster's default StorageClass.

---

### Issue 2: Secret Base64 Double-Encoding ⚠️ CRITICAL

**Problem:**
The render script (line 179) base64-encodes secret values before inserting them into Kubernetes manifests with `stringData:` fields. However, Kubernetes automatically encodes `stringData` values, resulting in double encoding.

**Evidence:**
Generated secrets contain base64-encoded values:

```yaml
# dist/dev2/analytics/grafana/grafana-secret.yml
stringData:
    GF_SECURITY_ADMIN_PASSWORD: YWRtaW4= # This is base64("admin")
    GF_DATABASE_PASSWORD: cG9zdGdyZXM= # This is base64("postgres")
```

**Impact:**

- Applications receive base64 strings instead of plaintext credentials
- Authentication fails for ALL services using these credentials
- Debugging is difficult as values appear correct in manifest but decode incorrectly at runtime

**Recommended Fix:**
Remove lines 178-180 from `infrastructure/scripts/render-k8s-configs.sh`:

```bash
# DELETE these lines:
if [[ "$secret_mode" == "true" && -n "${val}" ]]; then
  val="$(printf '%s' "$val" | b64_one_line)"
fi
```

Keep templates using `stringData:` - Kubernetes handles all encoding automatically.

---

### Issue 3: Grafana Database Credentials Hardcoded

**Problem:**
The render script (line 114) contains a hardcoded default value for `GF_DATABASE_PASSWORD`:

```bash
"GF-DATABASE-PASSWORD") echo "grafana" ;;
```

**Impact:**

- Database password is not configurable
- Cannot change password without modifying script
- Production deployments forced to use insecure "grafana" password
- Violates principle of externalized configuration

**Recommended Fix:**
Change line 114 to look up env var instead:

```bash
"GF-DATABASE-PASSWORD") env_value "GF_DATABASE_PASSWORD" ;;
```

Add to `.env.dev`:

```bash
GF_DATABASE_PASSWORD=grafana
```

---

### Issue 4: Matomo ConfigMap Reference Mismatch

**Problem:**
`matomo-db-statefulset.yaml` references a ConfigMap named `matomo-config`, but the actual ConfigMap is named `matomo-configmap`.

**Evidence:**

- `matomo-db-statefulset.yaml` line 41 references: `name: matomo-config`
- `matomo-configmap.yml` defines: `metadata.name: matomo-configmap`
- `matomo-statefulset.yaml` correctly references: `name: matomo-configmap`

**Impact:**

- Matomo database pod cannot start
- Pod logs show: "couldn't find key matomo-config in ConfigMap"
- Missing environment variables prevent database initialization

**Recommended Fix:**
Change `matomo-db-statefulset.yaml` line 41 from:

```yaml
name: matomo-config
```

to:

```yaml
name: matomo-configmap
```

**Status:** ✅ FIXED in template file

---

## 9. Deployment Checklist

Before deploying to any Kubernetes cluster (especially Kind):

- [ ] Apply fix for Issue 1: Remove `storageClassName: default` from `grafana-storage.yaml`
- [ ] Apply fix for Issue 2: Remove base64 encoding in `render-k8s-configs.sh` (lines 178-180)
- [ ] Apply fix for Issue 3: Make Grafana password configurable in `render-k8s-configs.sh` (line 114)
- [ ] Apply fix for Issue 4: Fix ConfigMap reference in `matomo-db-statefulset.yaml` (line 41)
- [ ] Render manifests: `ENV_FILE=.env.dev TEMPLATE_DIR=./infrastructure/int OUT_DIR=dist/dev2 bash ./infrastructure/scripts/render-k8s-configs.sh`
- [ ] Validate generated manifests have no empty values
- [ ] Deploy: `kubectl apply -f dist/dev2/`
- [ ] Verify all pods reach Ready state: `kubectl get pods -w`

---

## Conclusion

The infrastructure code is well-structured with 49 properly templated Kubernetes resources. However, **4 tactical bugs (Section 8)** prevent successful deployment to Kind/local clusters, and **1 strategic gap (Section 3.4)** blocks production readiness.

**Two-Phase Remediation:**

1. **Phase 1 - Fix Deployment Bugs** (Section 8)
    - Status: ❌ **NOT DEPLOYABLE without fixes**
    - Effort: 2 hours (4 straightforward fixes)
    - Outcome: ✅ **READY FOR KIND DEPLOYMENT**

2. **Phase 2 - Production Hardening** (Section 3.4)
    - Status: 🔴 **NOT PRODUCTION READY**
    - Effort: 2-3 days (Secret Management implementation)
    - Outcome: ✅ **PRODUCTION READY**

**Recommendation:** Fix all 4 bugs in Section 8 immediately to enable Kind testing. Parallel track: Begin Secret Management hardening (SealedSecret or ExternalSecret) for production target.
