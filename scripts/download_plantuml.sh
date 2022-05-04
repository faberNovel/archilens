#!/bin/bash -e

run() { (set -x ; "$@"); }

name_only="${NAME_ONLY:-false}"
dry_run="${DRY_RUN:-false}"

while true; do
    case "$1" in
        -h|--help)
            echo "Usage: $0 [--name-only] [-n|--dry-run]"
            exit 0
            ;;
        --name-only)
            name_only="true"
            shift
            ;;
        --no-name-only)
            name_only="false"
            shift
            ;;
        -n|--dry-run)
            dry_run="true"
            shift
            ;;
        --no-dry-run)
            dry_run="false"
            shift
            ;;
        *)
            echo "Unknown option: $1" >&2
            exit 1
            ;;
    esac
    if [[ "$#" == 0 ]]; then
        break
    fi
done

plantuml_version="${PLANTUML_VERSION:-1.2022.4}"
plantuml_jar="plantuml-${plantuml_version}.jar"
plantuml_url="https://github.com/plantuml/plantuml/releases/download/v${plantuml_version}/${plantuml_jar}"

if [[ "$name_only" != "true" ]]; then
    echo "Downloading plantuml version $plantuml_version ($plantuml_url)" >&2
    if [[ "$dry_run" != "true" ]]; then
        curl --silent --location "$plantuml_url" -o "$plantuml_jar"
        chmod +x "$plantuml_jar"
    fi
fi

echo "$plantuml_jar"
