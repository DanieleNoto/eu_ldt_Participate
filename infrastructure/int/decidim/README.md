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
````
