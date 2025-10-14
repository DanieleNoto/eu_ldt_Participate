FROM grafana/grafana:12.2.0


RUN mkdir -p /etc/grafana/provisioning/datasources \
    /etc/grafana/provisioning/dashboards \
    /var/lib/grafana/dashboards

# Copy provisioning files
COPY provisioning/datasources /etc/grafana/provisioning/datasources
COPY provisioning/dashboards /etc/grafana/provisioning/dashboards

# Copy dashboards
COPY dashboards/*.json /var/lib/grafana/dashboards/

USER 472