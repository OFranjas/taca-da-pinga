#!/usr/bin/env bash

set -euo pipefail

# Ensure we have a usable Java runtime available for the Firestore emulator
ensure_java() {
  if command -v java >/dev/null 2>&1 && java -version >/dev/null 2>&1; then
    return 0
  fi

  if [ -n "${JAVA_HOME:-}" ] && [ -x "$JAVA_HOME/bin/java" ]; then
    export PATH="$JAVA_HOME/bin:$PATH"
    if "$JAVA_HOME/bin/java" -version >/dev/null 2>&1; then
      return 0
    fi
  fi

  if command -v brew >/dev/null 2>&1; then
    if ! brew --prefix openjdk >/dev/null 2>&1 && ! brew --prefix openjdk@21 >/dev/null 2>&1; then
      echo "Installing OpenJDK via Homebrew..." >&2
      brew install --quiet openjdk >/dev/null 2>&1 || brew install --quiet openjdk@21 >/dev/null 2>&1
    fi
    local brew_prefix
    brew_prefix=$(brew --prefix openjdk 2>/dev/null || brew --prefix openjdk@21 2>/dev/null || true)
    if [ -n "$brew_prefix" ]; then
      export PATH="$brew_prefix/bin:$PATH"
      if java -version >/dev/null 2>&1; then
        return 0
      fi
    fi
  fi

  if command -v apt-get >/dev/null 2>&1; then
    if command -v sudo >/dev/null 2>&1 && sudo -n true >/dev/null 2>&1; then
      sudo apt-get update >/dev/null 2>&1
      sudo apt-get install -y openjdk-17-jre-headless >/dev/null 2>&1
    elif [ "$EUID" -eq 0 ]; then
      apt-get update >/dev/null 2>&1
      apt-get install -y openjdk-17-jre-headless >/dev/null 2>&1
    fi
    if command -v java >/dev/null 2>&1 && java -version >/dev/null 2>&1; then
      return 0
    fi
  fi

  if command -v yum >/dev/null 2>&1; then
    if command -v sudo >/dev/null 2>&1 && sudo -n true >/dev/null 2>&1; then
      sudo yum install -y java-17-openjdk >/dev/null 2>&1
    elif [ "$EUID" -eq 0 ]; then
      yum install -y java-17-openjdk >/dev/null 2>&1
    fi
    if command -v java >/dev/null 2>&1 && java -version >/dev/null 2>&1; then
      return 0
    fi
  fi

  return 1
}

if ! ensure_java; then
  cat >&2 <<'MSG'
Java runtime not found. Install OpenJDK (e.g. 'brew install openjdk' on macOS or
'sudo apt-get install openjdk-17-jre-headless' on Debian/Ubuntu) and re-run this command.
MSG
  exit 1
fi

echo "⏱  Ensuring rules test dependencies" >&2
yarn --cwd rules-tests install --immutable

echo "🚀  Launching Firestore emulator" >&2

run_tests() {
  firebase emulators:exec --only firestore "yarn --cwd rules-tests test"
}

if ! output=$(run_tests 2>&1); then
  printf '%s\n' "$output"

  if printf '%s' "$output" | grep -qi 'operation not permitted'; then
    cat >&2 <<'MSG'

Firestore emulator could not bind to the requested ports (EPERM).
This typically happens in locked-down environments where opening local ports
is prohibited. Re-run this command with the necessary permissions or allow
port binding for the Firebase emulator.

If you are running inside the Codex CLI, approve the elevated command request
when prompted so the emulator can start.
MSG
  fi

  exit 1
fi

printf '%s\n' "$output"
