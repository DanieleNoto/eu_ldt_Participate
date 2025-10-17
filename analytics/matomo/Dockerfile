FROM matomo:5.5.0

# Enable Apache headers module and create configuration for iframe embedding
RUN a2enmod headers && \
    echo 'Header unset X-Frame-Options' > /etc/apache2/conf-available/iframe.conf && \
    echo 'Header always set Access-Control-Allow-Origin "*"' >> /etc/apache2/conf-available/iframe.conf && \
    echo 'Header always set Content-Security-Policy "frame-ancestors *"' >> /etc/apache2/conf-available/iframe.conf && \
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

# Copy custom config file that will be used by Matomo
COPY config.ini.php /var/www/html/config/config.ini.php
RUN chown www-data:www-data /var/www/html/config/config.ini.php && \
    # Fix permissions for Apache
    chown -R www-data:www-data /var/www/html

# Switch to non-root user for security
USER www-data