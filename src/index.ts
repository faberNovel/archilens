import { importFromYaml } from './import'
import { cleanParserError } from './utils/parser-errors'

import * as YAML from "js-yaml"

async function main() {
  const model = importFromYaml({file: 'spec.yml', dir: 'example'})
  console.log(YAML.dump(model))
}
main().catch(e => console.error(cleanParserError(e)));
