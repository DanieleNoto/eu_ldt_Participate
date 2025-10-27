# frozen_string_literal: true

# JSON Logger Formatter for ELK Stack integration
# Handles ALL Rails logs (not just HTTP requests)
class JsonLogFormatter < ::Logger::Formatter
  def call(severity, timestamp, progname, msg)
    log_entry = {
      "@timestamp" => timestamp.utc.iso8601(3),
      "severity" => severity,
      "pid" => Process.pid,
      "application" => "decidim",
      "environment" => Rails.env
    }
    
    log_entry["progname"] = progname if progname
    
    # Add thread info
    log_entry["thread"] = Thread.current.object_id
    
    # Add request context if available (from RequestStore or similar)
    if defined?(::RequestStore) && ::RequestStore.store[:request_id]
      log_entry["request_id"] = ::RequestStore.store[:request_id]
    end
    
    # Format the message based on type
    log_entry.merge!(format_message(msg))
    
    "#{log_entry.to_json}\n"
  rescue StandardError => e
    # Fallback to plain text if JSON serialization fails
    fallback = {
      "@timestamp" => timestamp.utc.iso8601(3),
      "severity" => "ERROR",
      "message" => "Failed to serialize log: #{e.message}",
      "original_message" => msg.to_s[0..500]
    }
    "#{fallback.to_json}\n"
  end

  private

  def format_message(msg)
    case msg
    when String
      parse_string_message(msg)
    when Hash
      { "message" => msg }
    when Exception
      format_exception(msg)
    else
      { "message" => msg.inspect }
    end
  end
  
  def parse_string_message(msg)
    result = { "message" => msg }
    
    # Extract common Rails patterns
    if msg =~ /Started (\w+) "([^"]+)" for ([\d\.]+)/
      result["http_method"] = $1
      result["path"] = $2
      result["remote_ip"] = $3
      result["event"] = "request_started"
    elsif msg =~ /Processing by (.+)#(\w+) as (\w+)/
      result["controller"] = $1
      result["action"] = $2
      result["format"] = $3
      result["event"] = "processing"
    elsif msg =~ /Completed (\d+) .+ in (\d+)ms/
      result["status"] = $1.to_i
      result["duration_ms"] = $2.to_i
      result["event"] = "request_completed"
    elsif msg =~ /Rendered (.+) \(Duration: ([\d\.]+)ms/
      result["template"] = $1
      result["render_duration_ms"] = $2.to_f
      result["event"] = "template_rendered"
    elsif msg =~ /ActiveRecord: ([\d\.]+)ms/
      result["db_duration_ms"] = $1.to_f
      result["event"] = "database_query"
    end
    
    result
  end
  
  def format_exception(exception)
    {
      "message" => exception.message,
      "error_class" => exception.class.name,
      "error_message" => exception.message,
      "backtrace" => exception.backtrace&.first(15),
      "event" => "exception"
    }
  end
end
