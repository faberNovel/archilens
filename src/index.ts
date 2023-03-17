import { importFromYaml } from './import'
import { cleanParserError } from './utils/parser-errors'

async function main() {
  const model = importFromYaml({file: 'spec.yml', dir: 'example'})
  console.log(model)
}
main().catch(e => console.error(cleanParserError(e)));
