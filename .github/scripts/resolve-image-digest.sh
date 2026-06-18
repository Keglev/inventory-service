#!/usr/bin/env bash
# =============================================================================
# resolve-image-digest.sh — Resolves a Docker image tag to its SHA256 digest
# Usage: .github/scripts/resolve-image-digest.sh <namespace> <repository> <tag>
#
# Writes image_ref (docker.io/<namespace>/<repo>@sha256:...) to GITHUB_OUTPUT.
# Deploying by digest guarantees that the Trivy-scanned image is exactly what
# gets deployed, and enables safe rollback to any prior image.
# Retries handle Docker Hub eventual consistency right after a push.
# =============================================================================
set -euo pipefail

NAMESPACE="${1:?Usage: resolve-image-digest.sh <namespace> <repository> <tag>}"
REPO="${2:?Usage: resolve-image-digest.sh <namespace> <repository> <tag>}"
TAG="${3:?Usage: resolve-image-digest.sh <namespace> <repository> <tag>}"

echo "==> [resolve-image-digest] docker.io/${NAMESPACE}/${REPO}:${TAG}"

# Step 1 — Obtain an anonymous pull token (public images do not need credentials)
TOKEN="$(
  curl -fsSL --retry 5 --retry-connrefused --retry-delay 2 \
    "https://auth.docker.io/token?service=registry.docker.io&scope=repository:${NAMESPACE}/${REPO}:pull" \
  | grep -oE '"token"\s*:\s*"[^"]+"' \
  | sed -E 's/.*"token"\s*:\s*"([^"]+)".*/\1/'
)"
[ -z "${TOKEN:-}" ] && echo "::error::Could not obtain Docker Hub registry token" && exit 1

# Step 2 — Request the manifest and extract the Docker-Content-Digest header.
# Accepts manifest v2 and OCI index formats. Retries for eventual consistency.
MANIFEST_URL="https://registry-1.docker.io/v2/${NAMESPACE}/${REPO}/manifests/${TAG}"
HDRS="$(mktemp)"
STATUS=""

for attempt in $(seq 1 12); do
  echo "Manifest check $attempt/12..."
  STATUS="$(curl -sS \
    -D "$HDRS" -o /dev/null -w '%{http_code}' \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.docker.distribution.manifest.v2+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.index.v1+json" \
    "$MANIFEST_URL" || true)"
  echo "HTTP: $STATUS"
  [ "$STATUS" = "200" ] && break
  [ "$attempt" -lt 12 ] && sleep 10
done

[ "$STATUS" != "200" ] && echo "::error::Manifest request failed after 12 attempts (HTTP: $STATUS)" && exit 1

# Step 3 — Extract digest and write to GITHUB_OUTPUT
DIGEST="$(tr -d '\r' < "$HDRS" \
  | awk -F': ' 'tolower($1)=="docker-content-digest" {print $2}' \
  | tail -n1)"

if [ -z "${DIGEST:-}" ]; then
  echo "::error::Manifest returned 200 but Docker-Content-Digest header is missing"
  echo "::group::Response headers"; sed -n '1,40p' "$HDRS" || true; echo "::endgroup::"
  exit 1
fi

IMAGE_REF="docker.io/${NAMESPACE}/${REPO}@${DIGEST}"
echo "✓ Resolved: ${IMAGE_REF}"
echo "image_ref=${IMAGE_REF}" >> "$GITHUB_OUTPUT"