#!/bin/bash -e

run() { (set -x ; "$@"); }

dry_run="${DRY_RUN:-false}"

while true; do
    case "$1" in
        --dry-run)
            dry_run="true"
            shift
            ;;
        *)
            break
            ;;
    esac

done

plantuml_version="1.2022.4"
plantuml_jar="plantuml-${plantuml_version}.jar"
plantuml_url="https://github.com/plantuml/plantuml/releases/download/v${plantuml_version}/${plantuml_jar}"

if [[ "$dry_run" != "true" ]]; then
    echo "Downloading plantuml version $plantuml_version ($plantuml_url)" >&2
    curl --silent --location "$plantuml_url" -o "$plantuml_jar"
    chmod +x "$plantuml_jar"
fi

echo "$plantuml_jar"
