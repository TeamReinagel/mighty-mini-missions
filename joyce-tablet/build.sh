#!/usr/bin/env bash
set -euo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

# Honor an explicit JDK; otherwise use the registered macOS Java 17 installation.
if [[ -z "${JAVA_HOME:-}" && -x /usr/libexec/java_home ]]; then
    task_java_home="$(/usr/libexec/java_home -v 17 2>/dev/null || true)"
    if [[ -n "$task_java_home" ]]; then
        export JAVA_HOME="$task_java_home"
    fi
fi
if [[ -n "${JAVA_HOME:-}" ]]; then
    if [[ ! -x "$JAVA_HOME/bin/javac" ]]; then
        printf '%s\n' 'JAVA_HOME must point to a JDK (with bin/javac). See joyce-tablet/README.md.' >&2
        exit 1
    fi
    export PATH="$JAVA_HOME/bin:$PATH"
fi
if ! javac -version >/dev/null 2>&1; then
    printf '%s\n' 'Install JDK 17 or set JAVA_HOME to an existing JDK. See joyce-tablet/README.md.' >&2
    exit 1
fi

# local.properties or an explicit SDK environment setting takes precedence.
if [[ ! -f local.properties && -z "${ANDROID_HOME:-}" && -z "${ANDROID_SDK_ROOT:-}" ]]; then
    for task_sdk_path in "$HOME/Library/Android/sdk" "$HOME/Android/Sdk"; do
        if [[ -d "$task_sdk_path/platforms/android-35" ]]; then
            export ANDROID_HOME="$task_sdk_path"
            break
        fi
    done
    if [[ -z "${ANDROID_HOME:-}" ]]; then
        printf '%s\n' 'Set ANDROID_HOME or sdk.dir in joyce-tablet/local.properties to an Android SDK with platform 35.' >&2
        exit 1
    fi
fi

if [[ $# -eq 0 ]]; then
    set -- assembleDebug
fi
exec ./gradlew --console=plain --no-daemon "$@"
