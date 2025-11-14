#!/usr/bin/env ruby
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Denis Vasilev Dimchev



puts 'Current SMTP settings:'
Decidim::Organization.all.each { |org| puts "Org #{org.id}: #{org.smtp_settings.inspect} (#{org.smtp_settings.class})" }

puts 'Updating...'
Decidim::Organization.find_each do |org| 
  if org.smtp_settings.blank? || org.smtp_settings == '' || !org.smtp_settings.is_a?(Hash)
    puts "Updating org #{org.id} from #{org.smtp_settings.inspect} to {}"
    org.update_column(:smtp_settings, {}) 
  end
end

puts 'After update:'
Decidim::Organization.all.each { |org| puts "Org #{org.id}: #{org.smtp_settings.inspect} (#{org.smtp_settings.class})" }