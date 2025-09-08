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

## Configuration

The main configuration parameters are stored in the `jitsi-configmap.yml` file. You can modify this file to change Jitsi's behavior.

Sensitive information like passwords are stored in the `jitsi-secrets.yml` file.

## Integration with Decidim

To integrate Jitsi with Decidim, make sure the Decidim application can access the Jitsi instance at the configured URL.
