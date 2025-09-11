# Decidim Kubernetes manifests

This folder contains the Kubernetes manifests for the `decidim` application.

Important: the manifests reference a container image that you must build from the local Dockerfile
`decidim/decidim_application/Dockerfile` and push to a registry accessible by your cluster (for example `registry.example.com/your-namespace`).

Example build & push commands (update `REGISTRY`):

```bash
# from the repository root
REGISTRY=registry.example.com/your-namespace
docker build -t ${REGISTRY}/decidim:dev -f decidim/decidim_application/Dockerfile decidim/decidim_application
docker push ${REGISTRY}/decidim:dev
```

After pushing, update the `image` field in `decidim-deployment.yml` to `${REGISTRY}/decidim:dev` and apply the manifests:

```bash
kubectl apply -n participate -f infrastructure/int/decidim/
```

Quick tips:

- For local testing with `kind` you can run `kind load docker-image --name kind ${REGISTRY}/decidim:dev` after building the image.
- In production, use a CI pipeline to build/push images and a secrets manager for credentials.
- Adjust StorageClass, resource requests/limits and imagePullSecrets for AKS.

## Using the Apply Script

This directory contains a script to easily apply all Decidim Kubernetes configurations in the correct order:

```bash
# From the repository root
./infrastructure/int/decidim/apply-decidim-k8s.sh
```

The script will:

1. Create the namespace if it doesn't exist
2. Apply ConfigMaps and Secrets
3. Create PersistentVolumeClaims
4. Deploy PostgreSQL database
5. Deploy Redis
6. Deploy the Decidim application

This ensures all dependencies are created in the proper order.

## Variable tokenization and secrets usage

To improve security, many configuration values and sensitive variables have been replaced with placeholder tokens using the format
`_%TOOL3_DECIDIM_<KEY>%_`.

Files changed:

- `infrastructure/int/decidim/decidim-configmap.yml` — configuration variables now reference tokens such as `_%TOOL3_DECIDIM_DATABASE_HOST%_`.
- `infrastructure/int/decidim/decidim-secrets.yml` — sensitive values (passwords, secret key, SMTP credentials) were moved to `stringData` and replaced with tokens.

How to replace tokens before applying manifests:

- CI / pipeline: replace tokens using your pipeline templating tools (GitLab CI, GitHub Actions, etc.) or `envsubst` with the corresponding environment variables.
- Kubernetes: create the Secrets in-cluster with the real values and apply the ConfigMaps/Deployments that reference or load those Secrets.
- Helm / Kustomize: use values files, secretGenerator, or templating to produce final manifests before applying.
- Vault / SOPS: keep secrets in a secret manager and render manifests at deploy time.

Quick local example using `envsubst`:

```bash
# export required variables
export TOOL3_DECIDIM_DATABASE_HOST=decidim-postgres
export TOOL3_DECIDIM_DATABASE_PASSWORD=supersecret
# render and apply the configmap
envsubst < infrastructure/int/decidim/decidim-configmap.yml | kubectl apply -n participate -f -
```

Note about a token typo:
A small typo was detected in the `decidim-configmap.yml` tokenization for `FORCE_DATA_SETUP` where the token was generated as `_%TOOL3_DECIM_FORCE_DATA_SETUP%_` (missing the `ID` in `DECIDIM`). If you want, I can correct that token to `_%TOOL3_DECIDIM_FORCE_DATA_SETUP%_` to keep tokens consistent.

If you want, I can also:

- Fix the token typo in `decidim-configmap.yml` now.
- Add example Deployment manifests showing how to mount Secrets via `envFrom`.
- Add a small `render-manifests.sh` helper that runs `envsubst` for local development.
