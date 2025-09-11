Matomo Kubernetes manifests (AKS / kind)

Files in this folder:

Usage (apply in the `participate` namespace):
Matomo Kubernetes manifests (AKS / kind)

Files in this folder:

- `matomo-configmap.yml` - non-sensitive Matomo configuration
- `matomo-secret.yml` - sensitive values (DB password)
- `matomo-deployment.yml` - Deployment for Matomo
- `matomo-service.yml` - ClusterIP Service
- `matomo-pvc.yml` - PVC for Matomo storage
- `matomo-db-deployment.yml` - MariaDB StatefulSet/Deployment for Matomo

Usage (apply in the `participate` namespace):

```bash
kubectl apply -n participate -f infrastructure/int/analytics/matomo/
```

Variable tokenization and secrets handling:

To avoid hardcoding, configuration values can use placeholder tokens like `_%TOOL3_MATOMO_<KEY>%_`.

Files updated:

- `infrastructure/int/analytics/matomo/matomo-configmap.yml` — tokens instead of hardcoded values.
- `infrastructure/int/analytics/matomo/matomo-secret.yml` — keep sensitive values out of VCS; use secret stores in production.

How to replace tokens:

- CI / pipeline: render tokens using your pipeline templating tools or `envsubst`.
- Kubernetes: create the Secret in-cluster with real values and apply the manifests.
- Helm / Kustomize: use values files or secretGenerator to produce final manifests.

Quick local example with `envsubst`:

```bash
export TOOL3_MATOMO_DATABASE_HOST=matomo-db
export TOOL3_MATOMO_DATABASE_PASSWORD=supersecret
envsubst < infrastructure/int/analytics/matomo/matomo-configmap.yml | kubectl apply -n participate -f -
envsubst < infrastructure/int/analytics/matomo/matomo-secret.yml | kubectl apply -n participate -f -
```

Notes:

- Do not commit real passwords. Use a secret manager for production.
- Adjust storageClassName and resources for your cluster.
kubectl apply -n participate -f infrastructure/int/analytics/matomo/
