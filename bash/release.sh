#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION_FILE="${ROOT}/version.json"
BRANCH="${RELEASE_BRANCH:-main}"

cd "${ROOT}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "error" >&2
  exit 1
fi

echo "== remotes =="
if ! git remote -v | grep -q .; then
  echo "error" >&2
  exit 1
fi
git remote -v

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "error" >&2
  exit 1
fi

if [[ ! -f "${VERSION_FILE}" ]]; then
  echo "error" >&2
  exit 1
fi

read_build_version() {
  node -e "
    const fs = require('node:fs');
    const file = process.argv[1];
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!data.build || typeof data.build !== 'string') {
      console.error('error: version.json must contain a string \"build\" field');
      process.exit(1);
    }
    process.stdout.write(data.build);
  " "${VERSION_FILE}"
}

bump_build_version() {
  node -e "
    const fs = require('node:fs');
    const file = process.argv[1];
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const parts = data.build.split('.').map((p) => parseInt(p, 10));
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
      console.error('error: build version must be semver patch form (e.g. 0.0.1)');
      process.exit(1);
    }
    parts[2] += 1;
    data.build = parts.join('.');
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\\n');
    process.stdout.write(data.build);
  " "${VERSION_FILE}"
}

BUILD_VERSION="$(read_build_version)"
COMMIT_MSG="build v${BUILD_VERSION}"

git add .

if git diff --staged --quiet; then
  echo "nothing to commit"
  exit 0
fi

echo "== commit =="
git commit -m "${COMMIT_MSG}"

NEXT_VERSION="$(bump_build_version)"
echo "bumped version.json build -> v${NEXT_VERSION} (staged on next release)"

echo "== push =="
git push origin "${BRANCH}"

echo "done: ${COMMIT_MSG} pushed to origin/${BRANCH}"
