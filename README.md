# Archilens

## Install

1. Make sure you have installed

    - node & yarn (for plantuml files generation)
    - java (for svg files generation)
    - imagemagick (for png files generation)

2. Install the node dependancies

    ```sh
    yarn install
    ```

## Generate diagrams

1. Create your configuration file

    You can use the `config-example.yml` as base

2. Run the generation script

    ```sh
    ./scripts/gen.sh -- -c config.yml
    ```

    You can run `./scripts/gen.sh --help` to see the script's options
