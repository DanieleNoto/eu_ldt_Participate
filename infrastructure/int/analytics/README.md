# Analytics Kubernetes Manifests

This folder contains the Kubernetes manifests for the analytics components:

- Matomo: For tracking website usage and visitor analytics
- Grafana: For visualization of data and metrics

## Components

### Matomo

Matomo is an open-source analytics platform that provides complete web analytics without compromising user privacy. The Matomo setup includes:

- Web application
- MySQL database
- PersistentVolumeClaims for data storage

### Grafana

Grafana is an open-source analytics and monitoring solution that connects to various data sources to visualize metrics and create dashboards. The Grafana setup includes:

- Grafana server
- PersistentVolumeClaim for dashboard and configuration storage

## Using the Apply Script

This directory contains a script to easily apply all Analytics Kubernetes configurations in the correct order:

```bash
# From the repository root
./infrastructure/int/analytics/apply-analytics-k8s.sh
```

The script will:

1. Create the namespace if it doesn't exist
2. Deploy Matomo components (ConfigMap, Secret, PVC, Database, Application)
3. Deploy Grafana components (ConfigMap, Secret, PVC, Application)

This ensures all components are created in the proper order.

## Access

After deployment:

- Matomo: http://matomo.participate.local
- Grafana: http://grafana.participate.local

Make sure to add these entries to your `/etc/hosts` file if using local development.

## Integration with Decidim

To integrate analytics with Decidim:

1. Configure Matomo tracking in the Decidim admin panel
2. Connect Grafana to the Matomo database for custom dashboards
