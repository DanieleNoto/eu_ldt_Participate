# frozen_string_literal: true

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
class JsonLogFormatter < ::Logger::Formatter
  def call(severity, timestamp, progname, msg)
    log_entry = {
      "timestamp" => timestamp.utc.iso8601(3),
      "level" => severity,
      "tool_name" => "EU LDT Participate",
      "service_name" => "Decidim",
      "tool_version" => decidim_version,
      "environment" => Rails.env
    }

    # Add request context if available
    if defined?(::RequestStore) && ::RequestStore.store[:request_id]
      log_entry["request_id"] = ::RequestStore.store[:request_id]
    end

    # Add user context if available
    if defined?(::RequestStore) && ::RequestStore.store[:current_user_id]
      log_entry["user_id"] = ::RequestStore.store[:current_user_id]
    end

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
    begin
      parsed_json = JSON.parse(msg)
      if parsed_json.is_a?(Hash)
        # Extract structured data from the parsed JSON
        if parsed_json["method"] && parsed_json["path"]
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

        if parsed_json["controller"] && parsed_json["action"]
          result["source"] = {
            "file" => parsed_json["controller"].gsub('::', '/').downcase,
            "function" => parsed_json["action"]
          }
        end

        if parsed_json["status"]
          result["response_status"] = parsed_json["status"]
        end

        if parsed_json["duration"] || parsed_json["view"] || parsed_json["db"]
          result["metrics"] = {
            "response_time_ms" => parsed_json["duration"],
            "view_time_ms" => parsed_json["view"],
            "db_time_ms" => parsed_json["db"]
          }.compact
        end

        # Add any remaining fields as additional details
        parsed_json.each do |key, value|
          next if ["method", "path", "controller", "action", "status", "duration", "view", "db", "remote_ip", "user_id", "params"].include?(key)
          result["details"] ||= {}
          result["details"][key] = value
        end

        return result
      end
    rescue JSON::ParserError
      # Not a JSON string, continue with pattern matching
    end

    # Extract HTTP request information
    if msg =~ /Started (\w+) "([^"]+)" for ([\d\.]+)/
      result["event"] = {
        "http_verb" => $1,
        "path" => $2,
        "details" => {
          "remote_ip" => $3
        }
      }

      # Add additional request details if available
      add_request_details(result["event"]["details"])
    elsif msg =~ /Processing by (.+)#(\w+) as (\w+)/
      result["source"] = {
        "file" => $1.gsub('::', '/').downcase,
        "function" => $2
      }
    elsif msg =~ /Completed (\d+) .+ in (\d+)ms/
      result["response_status"] = $1.to_i
      result["metrics"] = {
        "response_time_ms" => $2.to_i
      }
    elsif msg =~ /Rendered (.+) \(Duration: ([\d\.]+)ms/
      result["source"] ||= {}
      result["source"]["file"] = $1.split('/').last
      result["metrics"] ||= {}
      result["metrics"]["render_time_ms"] = $2.to_f
    elsif msg =~ /Rendered (.+) \(([\d\.]+)ms\)/
      # Alternative pattern for rendered messages
      result["source"] ||= {}
      result["source"]["file"] = $1.split('/').last
      result["metrics"] ||= {}
      result["metrics"]["render_time_ms"] = $2.to_f
    elsif msg =~ /Cannot render console from ([\d\.]+)/
      # Console access messages
      result["event"] = {
        "details" => {
          "remote_ip" => $1,
          "event_type" => "console_access_denied"
        }
      }
    elsif msg =~ /(\w+) Load \(Duration: ([\d\.]+)ms\)/
      # Database load operations
      result["metrics"] ||= {}
      result["metrics"]["db_load_time_ms"] = $2.to_f
      result["event"] = {
        "details" => {
          "operation" => "db_load",
          "table" => $1
        }
      }
    elsif msg =~ /SELECT .* FROM "([^"]+)"/
      # SQL SELECT queries
      result["event"] ||= {}
      result["event"]["details"] ||= {}
      result["event"]["details"]["sql_table"] = $1
      result["event"]["details"]["sql_operation"] = "SELECT"
    elsif msg =~ /(.*) failed: (.*)/
      # Configuration or initialization failures
      result["event"] = {
        "details" => {
          "event_type" => "configuration_failure",
          "component" => $1.strip,
          "error" => $2.strip
        }
      }
    elsif msg =~ /(.+) not present; skipping (.+)/
      # Missing gem/component messages
      result["event"] = {
        "details" => {
          "event_type" => "component_skipped",
          "component" => $1.strip,
          "reason" => $2.strip
        }
      }
    elsif msg =~ /DEPRECATION WARNING: (.+)/
      # Deprecation warnings
      result["event"] = {
        "details" => {
          "event_type" => "deprecation_warning",
          "message" => $1.strip
        }
      }
    elsif msg =~ /WARN.*-- (.*)/ || msg =~ /WARNING.*-- (.*)/
      # General warning messages
      result["event"] = {
        "details" => {
          "event_type" => "warning",
          "message" => $1.strip
        }
      }
    end

    # Add message if no structured data was extracted
    result["message"] ||= msg
    result
  end

  def add_request_details(details)
    # Add user agent if available
    if defined?(::RequestStore) && ::RequestStore.store[:user_agent]
      details["user_agent"] = ::RequestStore.store[:user_agent]
    end

    # Add OAuth information if available
    if defined?(::RequestStore) && ::RequestStore.store[:oauth_server]
      details["oauth_server"] = ::RequestStore.store[:oauth_server]
    end

    if defined?(::RequestStore) && ::RequestStore.store[:oauth_scope]
      details["oauth_scope"] = ::RequestStore.store[:oauth_scope]
    end
  end

  def format_hash_message(msg)
    result = { "message" => msg.inspect }

    # If it's a structured log message, preserve it
    if msg.key?("event") || msg.key?("source") || msg.key?("metrics")
      result = msg
    end

    result
  end

  def format_exception(exception)
    error_class_name = exception.class.name.split('::').last
    {
      "error_id" => "ERR#{error_class_name.upcase}",
      "error_message" => exception.message,
      "source" => {
        "file" => exception.backtrace&.first&.split(':')&.first || "unknown",
        "function" => exception.backtrace&.first&.split(':in `')&.last&.chomp("'") || "unknown"
      },
      "event" => {
        "details" => {
          "backtrace" => exception.backtrace&.first(10)
        }
      }
    }
  end

  private

  def decidim_version
    defined?(::Decidim.version) ? ::Decidim.version : "unknown"
  end
end
