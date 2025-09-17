Grafana Kubernetes manifests (AKS / kind)

Files in this folder:

Usage (apply in the `participate` namespace):
kubectl apply -n participate -f infrastructure/int/analytics/grafana/

Files in this folder:

- `grafana-configmap.yml` - non-sensitive Grafana configuration (mapped from `.env` in local development)
- `grafana-secret.yml` - sensitive values (admin password, OAuth client secret) — keep these out of version control in production
- `grafana-deployment.yml` - Deployment for Grafana
- `grafana-service.yml` - ClusterIP Service
- `grafana-pvc.yml` - PVC for Grafana data

Usage (apply in the `participate` namespace):

```bash
kubectl apply -n participate -f infrastructure/int/analytics/grafana/
```

Security and tokenization:

- Do not commit real passwords. In production, use a secret manager (Vault, cloud secrets) or sealed secrets.
- For local development you can use `envsubst` or create a `grafana-secret.yml` from template values.
- If you templatize values, use tokens like `_ %TOOL3_GRAFANA_<KEY>%_` and render them in CI or before applying.

Quick local example with `envsubst`:

```bash
export TOOL3_GRAFANA_ADMIN_PASSWORD=supersecret
envsubst < infrastructure/int/analytics/grafana/grafana-configmap.yml | kubectl apply -n participate -f -
envsubst < infrastructure/int/analytics/grafana/grafana-secret.yml | kubectl apply -n participate -f -
```

Notes:

- Adjust resource requests/limits and `storageClassName` for your cluster (AKS, GKE, EKS, kind).
- Use imagePullSecrets if you host Grafana images in a private registry.
