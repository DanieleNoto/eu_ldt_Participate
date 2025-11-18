<!--
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro
  # Simone Bianchelli
 -->

# Grafana Configuration for Decidim 0.30 Analytics

This directory contains the updated Grafana configuration for monitoring Decidim 0.30 analytics.

## Custom Docker Image

This directory now contains a Dockerfile that builds a custom Grafana image with pre-configured dashboards and data sources. The dashboard and provisioning files are directly baked into the image, eliminating the need for external volume mounts.

Key benefits:

- Self-contained image with all configurations
- Easier deployment in Kubernetes
- No dependency on persistent volume claims for configuration
- Consistent dashboard setup across environments

### Usage

- For local development: Built via docker-compose
- For integration/production: Built and pushed to ACR via Azure DevOps pipeline

## Recent Updates for Decidim 0.30

- Fixed dashboard provisioning paths to work with the new Docker Compose setup
- Updated SQL queries to handle JSON fields more robustly with fallback locales
- Added filters for deleted items (`deleted_at IS NULL`)
- Improved user type filtering to exclude managed users and focus on real users
- Enhanced PostgreSQL connection settings for better performance
- Added new enhanced dashboard with additional metrics

## Structure

```
analytics/grafana/
├── Dockerfile                   # Custom Grafana image definition
├── provisioning/
│   ├── datasources/
│   │   └── decidim.yml          # PostgreSQL datasource configuration (updated)
│   └── dashboards/
│       ├── dashboard.yml        # Dashboard provider configuration
│       └── decidim.yml          # Decidim-specific dashboard provider (fixed paths)
└── dashboards/
    ├── decidim-analytics.json   # Main Decidim analytics dashboard (updated)
    ├── decidim-0.30-enhanced.json # Enhanced dashboard for Decidim 0.30
    ├── admin-reports-rg001.json # Administrative reports for PAR-RG001 user story
    ├── community-engagement.json # Community engagement analytics
    ├── communication-effectiveness.json # Communication effectiveness metrics
    ├── participation-demographics.json # Demographic analysis dashboard
    └── newsletter-communication-impact.json # Newsletter and communication impact
```

## Dashboard Categories

### Executive & Administrative Dashboards

1. **Administrative Reports (PAR-RG001)** - Comprehensive admin view meeting requirements for use case RG001
    - Executive summary with key metrics
    - Participation trends and activity tracking
    - Content performance analysis
    - Customizable time range filters (7 days to 1 year)
    - Export capabilities for offline use

2. **Decidim 0.30 Enhanced Analytics** - Updated main dashboard with improved metrics
    - User, process, assembly, and proposal counters
    - Multi-language support for titles and content
    - User distribution analysis
    - Recent activity tables

### Community Engagement Analysis

3. **Community Engagement Analytics** - Deep dive into user participation
    - Active contributor tracking
    - Engagement scoring (High/Medium/Low)
    - Activity distribution and trends
    - Top engaged users identification

4. **Participation Demographics** - Demographic analysis of community
    - User segmentation by activity level
    - Geographic participation patterns (if available)
    - Age and engagement correlation analysis

### Communication Effectiveness

5. **Communication Effectiveness** - Overall communication metrics
    - Message reach and response rates
    - Communication channel effectiveness
    - Content engagement analysis

6. **Newsletter & Communication Impact** - Specific newsletter analytics
    - Newsletter delivery and open rates
    - Response timeline analysis (24h, 3 days, 7 days)
    - Communication impact correlation with user activity
    - Detailed newsletter performance breakdown

## Configuration

### Datasource

- **Name**: Decidim PostgreSQL
- **Type**: PostgreSQL
- **Host**: db:5432 (from Docker environment)
- **Database**: decidim_application_development (from environment variables)
- **User**: postgres (from environment variables)

### Dashboard Improvements

The updated dashboards include:

#### Original Dashboard (updated):

- **Overview Panels**: Gauges showing users, admins, processes, and assemblies with proper filtering
- **Recent Process Table**: Latest participatory processes with multi-language title support
- **Latest Proposals**: Proposals with state information and proper JSON handling
- **User Registration Trend**: Line chart showing user registration over last 30 days with improved filtering

#### New Enhanced Dashboard:

- **Extended Metrics**: Total users, processes, assemblies, and proposals
- **User Distribution**: Pie chart showing admin vs regular vs managed users
- **Recent Processes**: Table with publication dates and enhanced sorting
- **Latest Proposals**: Table with proposal states and better formatting
- **Registration Trends**: Improved time series with proper user filtering

## Access

Once the Docker Compose stack is running, Grafana will be available at:

- **URL**: <http://localhost:3001>
- **Username**: admin (configurable via environment variables)
- **Password**: admin (configurable via environment variables)

## PAR-RG001 Compliance

The dashboard suite fully addresses the requirements of user story PAR-RG001 "View reports and analytics":

### Requirements Met:

- ✅ **Reports categorized by engagement area**: Separate dashboards for participation, communication effectiveness
- ✅ **Interactive visualizations**: All dashboards include interactive charts, filters, and drill-down capabilities
- ✅ **Detailed metrics**: Comprehensive metrics for community engagement assessment
- ✅ **Customizable filters**: Time range, demographics, and activity type filters
- ✅ **Export capabilities**: Built-in Grafana export functionality (PDF, PNG, CSV)
- ✅ **Real-time updates**: Dashboards refresh automatically with latest data

### Dashboard Usage Flow (PAR-RG001):

1. **Administrator navigates to Grafana Dashboard** → Access via http://localhost:3001
2. **System displays available reports** → Dashboard categories organized by engagement area
3. **User selects specific report** → Choose from 6 specialized dashboards
4. **System loads interactive visualizations** → Real-time data with detailed metrics
5. **User applies filters** → Customize time range, demographics, activity types
6. **System updates report view** → Dynamic filtering and real-time updates
7. **User exports report** → PDF, PNG, or CSV formats available
8. **System processes export** → Download ready files for offline use and stakeholder sharing

### Key Features for Administrators:

- **Comprehensive Engagement Assessment**: Track user activity, proposal performance, comment engagement
- **Communication Optimization**: Monitor newsletter effectiveness, response rates, message reach
- **Strategic Decision Support**: Identify trends, peak activity periods, and engagement patterns
- **Stakeholder Reporting**: Professional export formats for board meetings and reports
- **Multi-language Support**: Content displayed in multiple languages with fallback mechanisms

## Key Features for Administrators:

1. **Dashboard Provisioning**: Fixed paths from `/etc/grafana/provisioning/dashboards` to `/var/lib/grafana/dashboards`
2. **Docker Volume Mapping**: Updated volume mounts in docker-compose.yml to properly map dashboard files
3. **SQL Query Updates**:
    - Added `WHERE deleted_at IS NULL` filters to exclude soft-deleted records
    - Enhanced JSON field queries with locale fallbacks (`COALESCE(title->>'en', title->>'it', ...)`)
    - Added proper user type filtering (`type = 'Decidim::User'`)
4. **PostgreSQL Configuration**: Updated to use PostgreSQL 14+ settings for better compatibility

## Troubleshooting

If you encounter issues:

1. **Dashboard not loading**: Check that the dashboard files are properly mounted and accessible
2. **No data in charts**: Verify database connection and ensure the Decidim database is populated
3. **JSON field errors**: The updated queries now handle missing locale keys gracefully
4. **Connection timeouts**: The datasource configuration includes connection pooling settings

## Customization

To add new dashboards for Decidim 0.30:

1. Create JSON dashboard files in the `dashboards/` directory
2. Use the enhanced queries as templates for consistent data handling
3. Remember to include proper filtering for deleted records
4. Use COALESCE for JSON fields to handle multiple locales
5. They will be automatically loaded by Grafana on startup
6. Any changes to existing dashboards will be picked up within 10 seconds

## Queries

The dashboard uses SQL queries against the Decidim PostgreSQL database to extract:

- User statistics and registration trends
- Participatory process metrics
- Assembly information
- Administrative data

All queries are designed to be efficient and not impact the main application performance.
