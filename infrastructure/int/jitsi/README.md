# Jitsi Meet for Kubernetes

This directory contains Kubernetes configuration files for deploying Jitsi Meet in a Kubernetes cluster.

## Components

The Jitsi Meet deployment consists of the following components:

1. **Prosody**: XMPP server for signaling
2. **Jicofo**: Jitsi Conference Focus - manages the media sessions
3. **JVB**: Jitsi Video Bridge - routes video streams between participants
4. **Web**: Frontend interface for users

## How to Deploy

To deploy Jitsi Meet in your Kubernetes cluster, run:

```bash
./apply-jitsi-k8s.sh
```

This script will apply all necessary Kubernetes resources in the correct order.

## Accessing Jitsi

After deployment, add the following entry to your `/etc/hosts` file:

```
127.0.0.1 jitsi.participate.local
```

Then you can access Jitsi at: https://jitsi.participate.local

# Jitsi Meet for Kubernetes

This directory contains Kubernetes manifests to deploy Jitsi Meet in a Kubernetes cluster.

## Components

The deployment includes:

- Prosody (XMPP server)
- Jicofo (conference focus)
- JVB (video bridge)
- Web (frontend)

## Deploying

Use the helper script to apply resources in the correct order:

```bash
./apply-jitsi-k8s.sh
```

## Configuration and tokenization

Configuration values are stored in `jitsi-configmap.yml`. Sensitive values are kept in `jitsi-secrets.yml`.

To avoid hardcoding, many values have been replaced with placeholder tokens of the form `_%TOOL3_JITSI_<KEY>%_`.

Files updated:

- `infrastructure/int/jitsi/jitsi-configmap.yml` — tokens used for configuration values (e.g. `_%TOOL3_JITSI_XMPP_DOMAIN%_`).
- `infrastructure/int/jitsi/jitsi-secrets.yml` — tokens in `stringData` for sensitive values.

How to replace tokens before applying manifests:

- CI / pipeline: render tokens using your CI templating tools or `envsubst` with environment variables.
- Kubernetes: create the required Secrets in-cluster with the real values, then apply ConfigMaps/Deployments that reference those Secrets.
- Helm/Kustomize: use values files or secret generators to produce final manifests.
- Vault/SOPS: store secrets in a manager and render manifests at deploy time.

Quick local example with `envsubst`:

```bash
# export required variables
export TOOL3_JITSI_XMPP_DOMAIN=jitsi.participate.local
export TOOL3_JITSI_XMPP_BOSH_URL_BASE=https://jitsi.participate.local/http-bind
# render and apply
envsubst < infrastructure/int/jitsi/jitsi-configmap.yml | kubectl apply -n participate -f -
```

## Access

For local testing you can add a hosts entry:

```
127.0.0.1 jitsi.participate.local
```

Then open https://jitsi.participate.local in your browser.

If you want, I can:

- Validate the YAML files for syntax correctness.
- Add example Deployment snippets showing how to mount Secrets via `envFrom`.
- Provide a small `render-manifests.sh` helper script that runs `envsubst` for local development.
