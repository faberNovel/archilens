#!/bin/bash -e

die() { echo "$@" >&2; exit 3; }
run() { (set -x ; "$@"); }

output_dir=${OUTPUT_DIR:-"./output"}
cache_dir=${CACHE_DIR:-"./.notion_cache"}
clean_enabled=${CLEAN_ENABLED:-"false"}
cache_enabled=${CACHE_ENABLED:-"true"}
debug_enabled=${DEBUG_ENABLED:-"false"}
devmode_enabled=${DEV_MODE_ENABLED:-"false"}
force_build_enabled=${FORCE_BUILD_ENABLED:-"false"}
gen_svg_enabled=${GEN_SVG_ENABLED:-"true"}
gen_png_enabled=${GEN_PNG_ENABLED:-"true"}
use_tala=${USE_TALA:-"false"}

trap die SIGINT SIGTERM

if [[ -f "$HOME/.config/tstruct/auth.json" ]]; then
  use_tala="true"
fi

args=()
while true; do
  if [[ "$#" == 0 ]]; then
    break
  fi
  case "$1" in
    -h|--help)
      echo "Usage: gen.sh [options]" >&2
      echo "  -h, --help                 Print this help" >&2
      echo "  -d, --debug                Enable debug mode (default: false)" >&2
      echo "  -D, --no-debug             Disable debug mode" >&2
      echo "  -k, --clean                Clean cache before generating (default: false)" >&2
      echo "  -K, --no-clean             Do not clean cache before generating" >&2
      echo "  -c, --cache                Enable cache (default: true)" >&2
      echo "  -C, --no-cache             Disable cache" >&2
      echo "  -ed, --output-dir DIR      output directory (default: ./output)" >&2
      echo "  -cd, --cache-dir DIR       Cache directory (default: ./cache)" >&2
      echo "  -s, --svg                  Enable generation of SVG files (default: true)" >&2
      echo "  -S, --no-svg               Disable generation of SVG files" >&2
      echo "  -p, --png                  Enable generation of PNG files (default: true)" >&2
      echo "  -P, --no-png               Disable generation of PNG files" >&2
      echo "  --dev                      Enable dev mode (default: false)" >&2
      echo "  --no-dev                   Disable dev mode" >&2
      echo "  -b, --force-build          Force build (default: false)" >&2
      echo "  -B, --no-force-build       Do not force build" >&2
      echo "  -t, --tala                 Use tala (default: false)" >&2
      echo "  -T, --no-tala              Do not use tala" >&2
      echo "" >&2
      # echo "Be sure to generate your diagrams into '<output-dir>/plantuml/<filename>.plantuml'" >&2
      echo "Be sure to generate your diagrams into '<output-dir>/d2/<filename>.d2'" >&2
      exit 0
      ;;
    -d|--debug)
      debug_enabled=true
      shift
      ;;
    -D|--no-debug)
      debug_enabled=false
      shift
      ;;
    -k|--clean)
      clean_enabled=true
      shift
      ;;
    -K|--no-clean)
      clean_enabled=false
      shift
      ;;
    -c|--cache)
      cache_enabled=true
      shift
      ;;
    -C|--no-cache)
      cache_enabled=false
      shift
      ;;
    -ed|--output-dir)
      output_dir="$2"
      shift 2
      ;;
    -cd|--cache-dir)
      cache_dir="$2"
      cache_enabled=true
      shift 2
      ;;
    -s|--svg)
      gen_svg_enabled=true
      shift
      ;;
    -S|--no-svg)
      gen_svg_enabled=false
      gen_png_enabled=false
      shift
      ;;
    -p|--png)
      gen_svg_enabled=true
      gen_png_enabled=true
      shift
      ;;
    -P|--no-png)
      gen_png_enabled=false
      shift
      ;;
    --dev)
      devmode_enabled=true
      shift
      ;;
    --no-dev)
      devmode_enabled=false
      shift
      ;;
    -b | --force-build)
      force_build_enabled=true
      shift
      ;;
    -B | --no-force-build)
      force_build_enabled=false
      shift
      ;;
    -t | --tala)
      use_tala=true
      shift
      ;;
    -T | --no-tala)
      use_tala=false
      shift
      ;;
    --)
      shift
      args=("${args[@]}" "${@}")
      shift "$#"
      ;;
    -*)
      echo "Unknown option: $1"
      exit 1
      ;;
    *)
      args=("${args[@]}" "$1")
      break
      ;;
  esac
done

if [[ "$debug_enabled" == "true" ]]; then
  echo "output_dir: $output_dir" >&2
  echo "cache_dir: $cache_dir" >&2
  echo "clean_enabled: $clean_enabled" >&2
  echo "cache_enabled: $cache_enabled" >&2
  echo "debug_enabled: $debug_enabled" >&2
  echo "devmode_enabled: $devmode_enabled" >&2
  echo "force_build_enabled: $force_build_enabled" >&2
  echo "gen_svg_enabled: $gen_svg_enabled" >&2
  echo "gen_png_enabled: $gen_png_enabled" >&2
  echo "args: ${args[*]}" >&2
fi

if [[ "$clean_enabled" == "true" ]]; then
  if [[ -d "$output_dir" ]]; then
    echo "Deleting output dir ($output_dir)" >&2
    rm -rf "$output_dir"
  fi
  if [[ -d "$cache_dir" ]]; then
    echo "Deleting cache dir ($cache_dir)" >&2
    rm -rf "$cache_dir"
  fi
  if [[ -f "$plantuml_jar" ]]; then
    echo "Deleting plantuml jar ($plantuml_jar)" >&2
    rm -rf "$plantuml_jar"
  fi
fi
if [[ ! -d "$output_dir" ]]; then
  echo "Creating output dir ($output_dir)" >&2
  if [[ "$gen_svg_enabled" == "true" ]]; then
    mkdir -p "$output_dir/svg"
  fi
  if [[ "$gen_png_enabled" == "true" ]]; then
    mkdir -p "$output_dir/png"
  fi
fi

if [[ "$cache_enabled" == "true" ]]; then
  export NOTION_USE_CACHE="true"
  export NOTION_CACHE_DIR="$cache_dir"
fi

build_dir="./build"
if [[ "$force_build_enabled" == "true" ]]; then
  echo "Deleting build dir ($build_dir)" >&2
  rm -rf "$build_dir"
fi
if [[ "$force_build_enabled" == "true" || ("$devmode_enabled" != "true" && (! -d "$build_dir")) ]]; then
  echo "Building archilens..." >&2
  run yarn format
  run yarn build
fi

echo "Generating plantuml files..."
(
  if [[ "$debug_enabled" == "true" ]]; then
    export DEBUG=true
  fi
  if [[ "$devmode_enabled" == "true" ]]; then
    run yarn generate:dev "${args[@]}"
  else
    run yarn generate "${args[@]}"
  fi
)

if [[ "$gen_svg_enabled" == "true" ]]; then
  echo "Generating SVG files..." >&2
  if [[ -d "$output_dir/plantuml" ]]; then
    (
      cd "$output_dir/plantuml" || exit 2
      plantuml_jar="$(scripts/download_plantuml.sh --name-only)"

      if [[ "$debug_enabled" == "true" ]]; then
        "plantuml_jar: $plantuml_jar" >&2
      fi

      if [[ ! -x "$plantuml_jar" ]]; then
        scripts/download_plantuml.sh >/dev/null
      fi
      export JAVA_OPTS="-Djava.awt.headless=true -Dapple.awt.UIElement=true -Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8 $JAVA_OPTS"
      run java -jar "$plantuml_jar" -checkmetadata -o '../svg' -tsvg "$output_dir/plantuml/*.plantuml"
    )
  fi
  if [[ -d "$output_dir/d2" ]]; then
    (
      cd "$output_dir/d2" || exit 2
      gen() {
        for item in "$1"/*; do
          if [[ -d "$item" ]]; then
            gen "$item"
          elif [[ -f "$item" ]]; then
            local svg_file="../svg/${item/.d2/}.svg"
            mkdir -p "$(dirname "$svg_file")"
            local graphs=("elk" "dagre")
            if [[ "$use_tala" == "true" ]]; then
              graphs=("tala" "${graphs[@]}")
            fi
            gen_graph() {
              local graph_idx="$1"
              local graph_engine="${graphs[$graph_idx]}"
              if [[ -z "$graph_engine" ]]; then
                die "Failed to generate SVG file for $item"
              fi
              local gen_ok
              run d2 --layout="$graph_engine" "$item" "$svg_file" && gen_ok="true" || gen_ok="false"
              if [[ "$gen_ok" == "true" ]]; then
                : "noop"
              else
                gen_graph "$(( graph_idx + 1 ))" || exit "$?"
              fi
            }
            gen_graph "0" || exit "$?"
          fi
        done
      }
      gen "." || exit "$?"
    )
  fi
  if [[ -d "$output_dir/mermaid" ]]; then
    (
      cd "$output_dir/mermaid" || exit 2
      gen() {
        for item in "$1"/*; do
          if [[ -d "$item" ]]; then
            gen "$item"
          elif [[ -f "$item" ]]; then
            local svg_file="../svg/${item/.mermaid/}.svg"
            mkdir -p "$(dirname "$svg_file")"
            run yarn mmdc -i "$output_dir/mermaid/$item" -o "$output_dir/mermaid/$svg_file"
          fi
        done
      }
      gen "."
    )
  fi
else
  echo "Skipping SVG generation..." >&2
fi

if [[ "$gen_png_enabled" == "true" ]]; then
  echo "Generating PNG files..." >&2
  (
    cd "$output_dir/svg"
    for file in *.svg; do
      run convert -density 100 "$file" "../png/${file/.svg/}.png" || exit 3
    done
  )
else
  echo "Skipping PNG generation..." >&2
fi
