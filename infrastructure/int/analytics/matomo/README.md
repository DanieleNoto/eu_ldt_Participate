Matomo Kubernetes manifests (AKS / kind)

Files in this folder:
- `matomo-configmap.yml` - non-sensitive Matomo configuration
- `matomo-secret.yml` - sensitive values (DB password)
- `matomo-deployment.yml` - Deployment for Matomo
- `matomo-service.yml` - ClusterIP Service
- `matomo-pvc.yml` - PVC for Matomo storage
- `matomo-db-deployment.yml` - MariaDB StatefulSet/Deployment for Matomo

Usage (apply in the `participate` namespace):

kubectl apply -n participate -f infrastructure/int/analytics/matomo/
