# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
FROM matomo:5.5.0

# Enable Apache headers module and create configuration for iframe embedding
RUN a2enmod headers && \
    echo 'Header unset X-Frame-Options' > /etc/apache2/conf-available/iframe.conf && \
    echo 'Header always set Access-Control-Allow-Origin "*"' >> /etc/apache2/conf-available/iframe.conf && \
    echo 'Header always set Content-Security-Policy "frame-ancestors *"' >> /etc/apache2/conf-available/iframe.conf && \
    echo 'Header always unset X-Powered-By' >> /etc/apache2/conf-available/iframe.conf && \
    a2enconf iframe && \
    sed -i 's/Listen 80$/Listen 8080/' /etc/apache2/ports.conf && \
    sed -i 's/<VirtualHost \*:80>/<VirtualHost *:8080>/' /etc/apache2/sites-available/000-default.conf && \
    echo '<VirtualHost *:8080>' > /etc/apache2/sites-available/matomo-embed.conf && \
    echo '  ServerAdmin webmaster@localhost' >> /etc/apache2/sites-available/matomo-embed.conf && \
    echo '  DocumentRoot /var/www/html' >> /etc/apache2/sites-available/matomo-embed.conf && \
    echo '  <Directory /var/www/html>' >> /etc/apache2/sites-available/matomo-embed.conf && \
    echo '    Options FollowSymLinks' >> /etc/apache2/sites-available/matomo-embed.conf && \
    echo '    AllowOverride All' >> /etc/apache2/sites-available/matomo-embed.conf && \
    echo '    Require all granted' >> /etc/apache2/sites-available/matomo-embed.conf && \
    echo '  </Directory>' >> /etc/apache2/sites-available/matomo-embed.conf && \
    echo '</VirtualHost>' >> /etc/apache2/sites-available/matomo-embed.conf && \
    a2ensite matomo-embed

# Security: Disable PHP version exposure
RUN sed -i 's/expose_php = On/expose_php = Off/' /usr/local/etc/php/php.ini-production && \
    cp /usr/local/etc/php/php.ini-production /usr/local/etc/php/php.ini

# Copy custom config file with correct ownership
COPY --chown=www-data:www-data config.ini.php /var/www/html/config/config.ini.php

# Fix permissions for Apache (only for directories that exist)
RUN mkdir -p /var/www/html/tmp && \
    chown -R www-data:www-data /var/www/html/config && \
    chown www-data:www-data /var/www/html/tmp

# Switch to non-root user for security
USER www-data