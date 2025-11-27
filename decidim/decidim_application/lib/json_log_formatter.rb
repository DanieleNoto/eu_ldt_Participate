# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro

# JSON Logger Formatter for ELK Stack integration
# EU LDT Integrated Environment structured logging format
# Produces logs in the format:
# {
#   "timestamp": "2023-11-06T14:52:43.123Z",
#   "level": "ERROR",
#   "tool_name": "EU LDT Participate",
#   "service_name": "Decidim",
#   #   "tool_version": "0.30.2",  // Dynamic: uses Decidim.version
#   "user_id": "49fe07e4-bdff-4fc3-ad4e-4fc17317f580",
#   "request_id": "eea5126a-bbfc-4795-b522-2a798b167be4",
#   "response_status": 500,
#   "error_id": "ERR500",
#   "error_message": "Internal Server Error",
#   "event": {
#     "http_verb": "POST",
#     "path": "/maps",
#     "details": {
#       "user_agent": "Mozilla/5.0...",
#       "oauth_server": "EU LDT Identity Management",
#       "oauth_scope": "read"
#     }
#   },
#   "source": {
#     "environment": "production",
#     "file": "maps.js",
#     "function": "displayMap"
#   },
#   "metrics": {
#     "response_time_ms": 120
#   }
# }
# frozen_string_literal: true

class JsonLogFormatter < Logger::Formatter
  def call(severity, timestamp, _progname, msg)
    log_entry = {
      "timestamp" => timestamp.utc.iso8601(3),
      "level" => severity,
      "tool_name" => "EU LDT Participate",
      "service_name" => "Decidim",
      "tool_version" => decidim_version,
      "environment" => Rails.env
    }

    # Add request context if available
    log_entry["request_id"] = ::RequestStore.store[:request_id] if defined?(::RequestStore) && ::RequestStore.store[:request_id]

    # Add user context if available
    log_entry["user_id"] = ::RequestStore.store[:current_user_id] if defined?(::RequestStore) && ::RequestStore.store[:current_user_id]

    # Format the message based on type
    log_entry.merge!(format_message(msg))

    "#{log_entry.to_json}\n"
  rescue StandardError => e
    # Fallback to plain text if JSON serialization fails
    fallback = {
      "timestamp" => timestamp.utc.iso8601(3),
      "level" => "ERROR",
      "tool_name" => "EU LDT Integrated Environment",
      "service_name" => "Integrated Environment backend",
      "error_message" => "Failed to serialize log: #{e.message}",
      "original_message" => msg.to_s[0..500]
    }
    "#{fallback.to_json}\n"
  end

  # Public method for testing
  def test_parse_string_message(msg)
    parse_string_message(msg)
  end

  private

  def format_message(msg)
    case msg
    when String
      parse_string_message(msg)
    when Hash
      format_hash_message(msg)
    when Exception
      format_exception(msg)
    else
      { "message" => msg.inspect }
    end
  end

  def parse_string_message(msg)
    result = {}

    # Check if the message is already a JSON string (from Rails lograge or similar)
    json_result = parse_json_message(msg)
    return json_result if json_result

    # Extract HTTP request information using pattern matching
    result.merge!(parse_log_patterns(msg))

    # Add message if no structured data was extracted
    result["message"] ||= msg
    result
  end

  def parse_json_message(msg)
    parsed_json = JSON.parse(msg)
    return nil unless parsed_json.is_a?(Hash)

    result = {}

    # Extract structured data from the parsed JSON
    extract_http_event(result, parsed_json)
    extract_source(result, parsed_json)
    extract_status_and_metrics(result, parsed_json)
    extract_additional_details(result, parsed_json)

    result
  rescue JSON::ParserError
    nil
  end

  def extract_http_event(result, parsed_json)
    return unless parsed_json["method"] && parsed_json["path"]

    result["event"] = {
      "http_verb" => parsed_json["method"],
      "path" => parsed_json["path"],
      "details" => {
        "remote_ip" => parsed_json["remote_ip"],
        "user_id" => parsed_json["user_id"],
        "params" => parsed_json["params"]
      }.compact
    }
  end

  def extract_source(result, parsed_json)
    return unless parsed_json["controller"] && parsed_json["action"]

    result["source"] = {
      "file" => parsed_json["controller"].gsub("::", "/").downcase,
      "function" => parsed_json["action"]
    }
  end

  def extract_status_and_metrics(result, parsed_json)
    result["response_status"] = parsed_json["status"] if parsed_json["status"]

    return unless parsed_json["duration"] || parsed_json["view"] || parsed_json["db"]

    result["metrics"] = {
      "response_time_ms" => parsed_json["duration"],
      "view_time_ms" => parsed_json["view"],
      "db_time_ms" => parsed_json["db"]
    }.compact
  end

  def extract_additional_details(result, parsed_json)
    excluded_keys = %w(method path controller action status duration view db remote_ip user_id params)

    parsed_json.each do |key, value|
      next if excluded_keys.include?(key)

      result["details"] ||= {}
      result["details"][key] = value
    end
  end

  def parse_log_patterns(msg)
    result = {}

    parse_request_patterns(msg, result)
    parse_processing_patterns(msg, result)
    parse_completion_patterns(msg, result)
    parse_render_patterns(msg, result)
    parse_database_patterns(msg, result)
    parse_error_patterns(msg, result)
    parse_warning_patterns(msg, result)

    result
  end

  def add_request_details(details)
    # Add user agent if available
    details["user_agent"] = ::RequestStore.store[:user_agent] if defined?(::RequestStore) && ::RequestStore.store[:user_agent]

    # Add OAuth information if available
    details["oauth_server"] = ::RequestStore.store[:oauth_server] if defined?(::RequestStore) && ::RequestStore.store[:oauth_server]

    details["oauth_scope"] = ::RequestStore.store[:oauth_scope] if defined?(::RequestStore) && ::RequestStore.store[:oauth_scope]
  end

  def format_hash_message(msg)
    result = { "message" => msg.inspect }

    # If it's a structured log message, preserve it
    result = msg if msg.has_key?("event") || msg.has_key?("source") || msg.has_key?("metrics")

    result
  end

  def format_exception(exception)
    error_class_name = exception.class.name.split("::").last
    backtrace = exception.backtrace&.first
    file = backtrace&.split(":")&.first || "unknown"
    function_part = backtrace&.split(":in `")&.last
    function = function_part&.chomp("'") || "unknown"
    {
      "error_id" => "ERR#{error_class_name.upcase}",
      "error_message" => exception.message,
      "source" => {
        "file" => file,
        "function" => function
      },
      "event" => {
        "details" => {
          "backtrace" => exception.backtrace&.first(10)
        }
      }
    }
  end

  def decidim_version
    defined?(::Decidim.version) ? ::Decidim.version : "unknown"
  end

  def parse_request_patterns(msg, result)
    case msg
    when /Started (\w+) "([^"]+)" for ([\d\.]+)/
      result["event"] = {
        "http_verb" => ::Regexp.last_match(1),
        "path" => ::Regexp.last_match(2),
        "details" => {
          "remote_ip" => ::Regexp.last_match(3)
        }
      }
      add_request_details(result["event"]["details"])
    when /Cannot render console from ([\d\.]+)/
      result["event"] = {
        "details" => {
          "remote_ip" => ::Regexp.last_match(1),
          "event_type" => "console_access_denied"
        }
      }
    end
  end

  def parse_processing_patterns(msg, result)
    case msg
    when /Processing by (.+)#(\w+) as (\w+)/
      result["source"] = {
        "file" => ::Regexp.last_match(1).gsub("::", "/").downcase,
        "function" => ::Regexp.last_match(2)
      }
    end
  end

  def parse_completion_patterns(msg, result)
    case msg
    when /Completed (\d+) .+ in (\d+)ms/
      result["response_status"] = ::Regexp.last_match(1).to_i
      result["metrics"] = {
        "response_time_ms" => ::Regexp.last_match(2).to_i
      }
    end
  end

  def parse_render_patterns(msg, result)
    case msg
    when /Rendered (.+) \(Duration: ([\d\.]+)ms/, /Rendered (.+) \(([\d\.]+)ms\)/
      result["source"] ||= {}
      result["source"]["file"] = ::Regexp.last_match(1).split("/").last
      result["metrics"] ||= {}
      result["metrics"]["render_time_ms"] = ::Regexp.last_match(2).to_f
    end
  end

  def parse_database_patterns(msg, result)
    case msg
    when /(\w+) Load \(Duration: ([\d\.]+)ms\)/
      result["metrics"] ||= {}
      result["metrics"]["db_load_time_ms"] = ::Regexp.last_match(2).to_f
      result["event"] = {
        "details" => {
          "operation" => "db_load",
          "table" => ::Regexp.last_match(1)
        }
      }
    when /SELECT .* FROM "([^"]+)"/
      result["event"] ||= {}
      result["event"]["details"] ||= {}
      result["event"]["details"]["sql_table"] = ::Regexp.last_match(1)
      result["event"]["details"]["sql_operation"] = "SELECT"
    end
  end

  def parse_error_patterns(msg, result)
    case msg
    when /(.+) failed: (.*)/
      result["event"] = {
        "details" => {
          "event_type" => "configuration_failure",
          "component" => ::Regexp.last_match(1).strip,
          "error" => ::Regexp.last_match(2).strip
        }
      }
    when /(.+) not present; skipping (.+)/
      result["event"] = {
        "details" => {
          "event_type" => "component_skipped",
          "component" => ::Regexp.last_match(1).strip,
          "reason" => ::Regexp.last_match(2).strip
        }
      }
    end
  end

  def parse_warning_patterns(msg, result)
    case msg
    when /DEPRECATION WARNING: (.+)/, /WARN.*-- (.*)/, /WARNING.*-- (.*)/
      result["event"] = {
        "details" => {
          "event_type" => "warning",
          "message" => ::Regexp.last_match(1).strip
        }
      }
    end
  end
end
