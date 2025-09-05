Grafana Kubernetes manifests (AKS / kind)

Files in this folder:
- `grafana-configmap.yml` - non-sensitive Grafana configuration mapped from `.env`
- `grafana-secret.yml` - sensitive values (admin password, oauth client secret)
- `grafana-deployment.yml` - Deployment for Grafana
- `grafana-service.yml` - ClusterIP Service
- `grafana-pvc.yml` - PVC for Grafana data

Usage (apply in the `participate` namespace):

kubectl apply -n participate -f infrastructure/int/analytics/grafana/

Notes:
- In production use a secret manager and do not commit real passwords.
- Adjust resource requests/limits and storage class for AKS.
