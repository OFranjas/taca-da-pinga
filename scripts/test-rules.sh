#!/usr/bin/env bash

set -euo pipefail

# Ensure we have a Java runtime available for the Firestore emulator
if ! command -v java >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1 && brew --prefix openjdk >/dev/null 2>&1; then
    export PATH="$(brew --prefix openjdk)/bin:$PATH"
  elif [ -n "${JAVA_HOME:-}" ] && [ -x "$JAVA_HOME/bin/java" ]; then
    export PATH="$JAVA_HOME/bin:$PATH"
  fi
fi

if ! command -v java >/dev/null 2>&1; then
  echo "Java runtime not found. Install OpenJDK (e.g. 'brew install openjdk') or set JAVA_HOME." >&2
  exit 1
fi

yarn --cwd rules-tests install --immutable
firebase emulators:exec --only firestore "yarn --cwd rules-tests test"
