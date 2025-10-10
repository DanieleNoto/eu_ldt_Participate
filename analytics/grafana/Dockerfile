FROM grafana/grafana:11.0.0

# Copy provisioning files
COPY provisioning/datasources /etc/grafana/provisioning/datasources
COPY provisioning/dashboards /etc/grafana/provisioning/dashboards

# Copy dashboards
COPY dashboards /var/lib/grafana/dashboards

USER 472