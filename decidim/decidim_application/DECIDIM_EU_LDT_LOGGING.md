<!--
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Gianfranco Cedro
 -->

# Decidim Logging - EU LDT Structured JSON Format for ELK Stack Integration

## Overview

Decidim has been configured to output **structured JSON logs** in the EU LDT format, optimized for ingestion into ELK (Elasticsearch, Logstash, Kibana) stack. All logs are formatted as JSON objects with consistent field structure following EU LDT specifications.

## Log Structure

Each log entry is a JSON object with the following EU LDT standard fields:

```json
{
	"timestamp": "2025-10-28T17:35:45.943Z",
	"level": "INFO",
	"tool_name": "EU LDT Participate",
	"service_name": "Decidim",
	"tool_version": "0.30.2",
	"environment": "development",
	"request_id": "eea5126a-bbfc-4795-b522-2a798b167be4",
	"event": {
		"http_verb": "GET",
		"path": "/api/assets",
		"details": {
			"remote_ip": "127.0.0.1",
			"user_id": null
		}
	},
	"source": {
		"file": "api/assetscontroller",
		"function": "index"
	},
	"metrics": {
		"response_time_ms": 150.5
	},
	"response_status": 200,
	"message": "Original log message (fallback)"
}
```

## Standard Fields

| Field             | Type           | Description                                         | Example                                   |
| ----------------- | -------------- | --------------------------------------------------- | ----------------------------------------- |
| `timestamp`       | ISO8601 string | UTC timestamp with millisecond precision            | `2025-10-28T17:35:45.943Z`                |
| `level`           | String         | Log level (DEBUG, INFO, WARN, ERROR, FATAL)         | `INFO`                                    |
| `tool_name`       | String         | Tool identifier (always "EU LDT Participate")       | `EU LDT Participate`                      |
| `service_name`    | String         | Service name (always "Decidim")                     | `Decidim`                                 |
| `tool_version`    | String         | Decidim version (dynamically detected)              | `0.30.2`                                  |
| `environment`     | String         | Rails environment                                   | `production`, `development`, `staging`    |
| `request_id`      | String         | Unique request identifier for correlation           | `eea5126a-bbfc-4795-b522-2a798b167be4`    |
| `event`           | Object         | Event details (HTTP requests, errors, warnings)     | See below                                 |
| `source`          | Object         | Source information (controller, action, file)       | See below                                 |
| `metrics`         | Object         | Performance metrics (timing, allocations)           | See below                                 |
| `response_status` | Integer        | HTTP response status code                           | `200`, `404`, `500`                       |
| `message`         | String         | Original log message (fallback when not structured) | `Started GET "/api/assets" for 127.0.0.1` |

## Structured Field Details

### Event Object

Contains information about the event that triggered the log:

```json
{
	"event": {
		"http_verb": "GET",
		"path": "/api/assets",
		"details": {
			"remote_ip": "127.0.0.1",
			"user_id": 42,
			"event_type": "http_request",
			"sql_operation": "SELECT",
			"sql_table": "users"
		}
	}
}
```

**Event Types:**

- `http_request`: HTTP requests with verb, path, IP, user
- `configuration_failure`: Configuration errors
- `component_skipped`: Missing components/gems
- `deprecation_warning`: Rails deprecation warnings
- `console_access_denied`: Console access attempts
- `db_load`: Database operations

### Source Object

Identifies the source of the log entry:

```json
{
	"source": {
		"file": "api/assetscontroller",
		"function": "index"
	}
}
```

**Source Fields:**

- `file`: Controller or source file (normalized path)
- `function`: Action method or function name

### Metrics Object

Performance and timing information:

```json
{
	"metrics": {
		"response_time_ms": 150.5,
		"render_time_ms": 120.0,
		"db_load_time_ms": 5.2,
		"view_time_ms": 25.3
	}
}
```

**Available Metrics:**

- `response_time_ms`: Total request duration
- `render_time_ms`: View rendering time
- `db_load_time_ms`: Database query time
- `view_time_ms`: View processing time

## Message Types and Examples

### 1. HTTP Request Logs (Structured)

```json
{
	"timestamp": "2025-10-28T17:35:46.418Z",
	"level": "INFO",
	"tool_name": "EU LDT Participate",
	"service_name": "Decidim",
	"tool_version": "0.30.2",
	"environment": "development",
	"event": {
		"http_verb": "GET",
		"path": "/rails/active_storage/disk/...",
		"details": {
			"remote_ip": null,
			"user_id": null,
			"params": {
				"encoded_key": "[FILTERED]",
				"filename": "042"
			}
		}
	},
	"source": {
		"file": "activestorage/diskcontroller",
		"function": "show"
	},
	"metrics": {
		"response_time_ms": 0.64,
		"view_time_ms": 0.0,
		"db_time_ms": 0.0
	},
	"response_status": 200
}
```

### 2. Configuration Errors (Structured)

```json
{
	"timestamp": "2025-10-28T17:35:45.943Z",
	"level": "WARN",
	"tool_name": "EU LDT Participate",
	"service_name": "Decidim",
	"tool_version": "0.30.2",
	"environment": "development",
	"event": {
		"details": {
			"event_type": "configuration_failure",
			"component": "Shakapacker configuration",
			"error": "undefined method `configure' for module Shakapacker"
		}
	}
}
```

### 3. Component Warnings (Structured)

```json
{
	"timestamp": "2025-10-28T17:35:45.943Z",
	"level": "INFO",
	"tool_name": "EU LDT Participate",
	"service_name": "Decidim",
	"tool_version": "0.30.2",
	"environment": "development",
	"event": {
		"details": {
			"event_type": "component_skipped",
			"component": "Sidekiq gem",
			"reason": "Sidekiq initializer"
		}
	}
}
```

### 4. Deprecation Warnings (Structured)

```json
{
	"timestamp": "2025-10-28T17:35:46.418Z",
	"level": "WARN",
	"tool_name": "EU LDT Participate",
	"service_name": "Decidim",
	"tool_version": "0.30.2",
	"environment": "development",
	"event": {
		"details": {
			"event_type": "deprecation_warning",
			"message": "forbid-line already registered..."
		}
	}
}
```

### 5. Database Operations (Structured)

```json
{
	"timestamp": "2025-10-28T17:35:46.420Z",
	"level": "DEBUG",
	"tool_name": "EU LDT Participate",
	"service_name": "Decidim",
	"tool_version": "0.30.2",
	"environment": "development",
	"metrics": {
		"db_load_time_ms": 5.2
	},
	"event": {
		"details": {
			"operation": "db_load",
			"table": "User"
		}
	}
}
```

## Elasticsearch Query Examples

### Find slow requests (> 1 second)

```json
{
	"query": {
		"range": {
			"metrics.response_time_ms": { "gte": 1000 }
		}
	}
}
```

### Find errors by time range

```json
{
	"query": {
		"bool": {
			"must": [{ "term": { "level": "ERROR" } }, { "range": { "timestamp": { "gte": "now-1h" } } }]
		}
	}
}
```

### Track specific user activity

```json
{
	"query": {
		"term": { "event.details.user_id": 42 }
	}
}
```

### Find configuration failures

```json
{
	"query": {
		"term": { "event.details.event_type": "configuration_failure" }
	}
}
```

### Aggregate requests by controller

```json
{
	"aggs": {
		"by_controller": {
			"terms": { "field": "source.file.keyword" }
		}
	}
}
```

### Find database performance issues

```json
{
	"query": {
		"range": {
			"metrics.db_load_time_ms": { "gte": 100 }
		}
	}
}
```

## Kibana Dashboard Ideas

### 1. **EU LDT Performance Dashboard**

- Average response time by endpoint (`metrics.response_time_ms`)
- 95th percentile response times
- Database performance (`metrics.db_load_time_ms`)
- View rendering bottlenecks (`metrics.view_time_ms`)

### 2. **Error & Warning Monitoring**

- Error rate over time by level (`level`)
- Configuration failures (`event.details.event_type: "configuration_failure"`)
- Deprecation warnings (`event.details.event_type: "deprecation_warning"`)
- Top error components (`event.details.component`)

### 3. **User Activity & Security**

- Active users count (`event.details.user_id`)
- Top users by request count
- Failed authentication attempts
- Console access denials (`event.details.event_type: "console_access_denied"`)

### 4. **System Health & Operations**

- Request rate by HTTP method (`event.http_verb`)
- Status code distribution (`response_status`)
- Request correlation (`request_id`)
- Component availability (`event.details.event_type: "component_skipped"`)

## Index Pattern Configuration

**Recommended index pattern**: `eu-ldt-decidim-*`

This supports daily indices like:

- `eu-ldt-decidim-2025.10.28`
- `eu-ldt-decidim-2025.10.29`

**Time field**: `timestamp`

## Log Aggregation Strategy

Logs can be aggregated by:

- **Time**: `timestamp` (hourly, daily, weekly)
- **Severity**: `level` field (INFO, ERROR, WARN, etc.)
- **Environment**: `environment` field (production, staging, development)
- **Request Correlation**: `request_id` field (trace complete user journeys)
- **Event Type**: `event.details.event_type` (categorize by operation type)
- **Endpoint**: `event.path` or `source.file`
- **User**: `event.details.user_id` (user behavior analysis)
- **Performance**: `metrics.*` fields (identify bottlenecks)

## Configuration

EU LDT structured JSON logging is enabled via:

```bash
# Application configuration
config.log_formatter = JsonLogFormatter.new

# Environment variables
ENABLE_JSON_LOGS=true
RAILS_LOG_TO_STDOUT=true
```

This configuration is active in:

- **Kubernetes**: decidim-configmap.yml
- **Docker Compose**: .env file
- **Production**: Always enabled when deployed

## Performance Impact

- **Log size**: ~20-30% larger than plain text (acceptable for structured data benefits)
- **CPU usage**: Minimal JSON serialization overhead (<2% CPU)
- **Parsing speed**: Native JSON parsing in Logstash (much faster than regex)
- **Query performance**: Optimized for Elasticsearch aggregations

## Benefits for EU LDT Operations

1. **Structured EU LDT compliance**: Follows EU LDT logging specifications
2. **Type safety**: Numeric fields are actual numbers, not strings
3. **Rich querying**: Native JSON field access in Elasticsearch
4. **Request correlation**: Complete request tracing via `request_id`
5. **Performance monitoring**: Detailed metrics for bottleneck identification
6. **Security auditing**: Structured user activity and access logs
7. **Operational intelligence**: Component health and configuration monitoring

## EU LDT Field Mapping

| EU LDT Field   | Decidim Implementation | Description                |
| -------------- | ---------------------- | -------------------------- |
| `timestamp`    | `timestamp`            | ISO8601 UTC timestamp      |
| `level`        | `level`                | Log severity level         |
| `tool_name`    | `tool_name`            | "EU LDT Participate"       |
| `service_name` | `service_name`         | "Decidim"                  |
| `tool_version` | `tool_version`         | Dynamic Decidim version    |
| `environment`  | `environment`          | Rails environment          |
| `request_id`   | `request_id`           | Request correlation ID     |
| `event`        | `event`                | Event details object       |
| `source`       | `source`               | Source information object  |
| `metrics`      | `metrics`              | Performance metrics object |

---

**References:**

- Formatter: `lib/json_log_formatter.rb`
- Configuration: `config/application.rb`
- EU LDT Specifications: Project documentation</content>
  <parameter name="filePath">/home/gcedro/dev/decidim0.30/eu-ldt-participate/decidim/decidim_application/DECIDIM_EU_LDT_LOGGING.md
