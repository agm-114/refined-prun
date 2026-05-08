#!/usr/bin/env bash
# Generate updates.json for upload to GCS.
#
# Usage: bash scripts/generate-update-manifest.sh <xpi-file> <public-xpi-url>
#
# Example:
#   bash scripts/generate-update-manifest.sh refined-prun-1.2.3.xpi \
#     https://storage.googleapis.com/MY_BUCKET/refined-prun-1.2.3.xpi
#
# Output: updates.json at repo root (upload this file to GCS alongside the .xpi)
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

xpi_file="${1:-}"
xpi_url="${2:-}"

if [[ -z "$xpi_file" || -z "$xpi_url" ]]; then
  echo "Usage: $0 <xpi-file> <public-xpi-url>" >&2
  exit 1
fi

if [[ ! -f "$xpi_file" ]]; then
  echo "Error: file not found: $xpi_file" >&2
  exit 1
fi

version="$(node -e "const m=require('./dist/manifest.json');process.stdout.write(m.version)")"
hash="$(sha256sum "$xpi_file" | cut -d' ' -f1)"

sed \
  -e "s/VERSION/${version}/g" \
  -e "s|XPI_URL|${xpi_url}|g" \
  -e "s/HASH/${hash}/g" \
  scripts/updates.template.json > updates.json

echo "generate-update-manifest: wrote updates.json"
echo "  version:     ${version}"
echo "  update_link: ${xpi_url}"
echo "  sha256:      ${hash}"
echo ""
echo "Upload both files to GCS:"
echo "  gsutil cp ${xpi_file} gs://YOUR_BUCKET/${xpi_file}"
echo "  gsutil cp updates.json gs://YOUR_BUCKET/updates.json"
