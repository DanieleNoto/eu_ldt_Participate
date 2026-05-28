{{- /*
SPDX-FileCopyrightText: 2024 European Union
SPDX-License-Identifier: AGPL-3.0-or-later
*/ -}}

{{- /*
eu-ldt-participate.namespace
Returns the namespace from values or default "participate"
*/ -}}
{{- define "eu-ldt-participate.namespace" -}}
{{- .Values.namespace | default "participate" -}}
{{- end }}

{{- /*
eu-ldt-participate.labels
Common labels for all resources
*/ -}}
{{- define "eu-ldt-participate.labels" -}}
app.kubernetes.io/name: eu-ldt-participate
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end }}

{{- /*
eu-ldt-participate.image
Returns a full image reference given a repo name
Usage: {{ include "eu-ldt-participate.image" (dict "repo" "eu-ldt-part-int" "root" .) }}
*/ -}}
{{- define "eu-ldt-participate.image" -}}
{{- $root := .root -}}
{{- $repo := .repo -}}
{{- if $root.Values.image.registry -}}
{{- printf "%s/%s:%s" $root.Values.image.registry $repo $root.Values.image.tag -}}
{{- else -}}
{{- printf "%s:%s" $repo $root.Values.image.tag -}}
{{- end -}}
{{- end }}

{{- /*
eu-ldt-participate.imagePullPolicy
Returns the image pull policy or default "Always"
*/ -}}
{{- define "eu-ldt-participate.imagePullPolicy" -}}
{{- .Values.image.pullPolicy | default "Always" -}}
{{- end }}

{{- /*
eu-ldt-participate.imagePullSecrets
Returns the imagePullSecrets block when acr.enabled is true
*/ -}}
{{- define "eu-ldt-participate.imagePullSecrets" -}}
{{- if .Values.acr.enabled }}
imagePullSecrets:
  - name: acr-secret
{{- end }}
{{- end }}
