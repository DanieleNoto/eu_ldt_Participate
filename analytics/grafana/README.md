# Grafana Configuration for Decidim Analytics

This directory contains the Grafana configuration for monitoring Decidim analytics.

## Structure

```
analytics/grafana/
├── provisioning/
│   ├── datasources/
│   │   └── decidim.yml          # PostgreSQL datasource configuration
│   └── dashboards/
│       ├── dashboard.yml        # Dashboard provider configuration
│       └── decidim.yml          # Decidim-specific dashboard provider
└── dashboards/
    └── decidim-analytics.json   # Main Decidim analytics dashboard
```

## Configuration

### Datasource

- **Name**: Decidim PostgreSQL
- **Type**: PostgreSQL
- **Host**: db:5432
- **Database**: decidim_application_development
- **User**: postgres
- **Password**: postgres (from environment variables)

### Dashboard

The main dashboard includes:

- **Overview Panel**: Pie chart showing users, admins, processes, and assemblies
- **Recent Users Table**: Latest registered users with their details
- **User Registration Trend**: Line chart showing user registration over last 30 days

## Access

Once the Docker Compose stack is running, Grafana will be available at:

- **URL**: <http://localhost:3001>
- **Username**: admin
- **Password**: admin

## Customization

To add new dashboards:

1. Create JSON dashboard files in the `dashboards/` directory
2. They will be automatically loaded by Grafana on startup
3. Any changes to existing dashboards will be picked up within 10 seconds

## Queries

The dashboard uses SQL queries against the Decidim PostgreSQL database to extract:

- User statistics and registration trends
- Participatory process metrics
- Assembly information
- Administrative data

All queries are designed to be efficient and not impact the main application performance.
