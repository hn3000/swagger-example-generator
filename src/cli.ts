
import * as minimist from 'minimist';
import * as sway from 'sway';

import { exemplify } from './api-examples'
import * as fs from 'fs';

async function runX(argv: string[]): Promise<void> {
  let args = minimist(argv);



  if (
    Object.keys(args).some((x) => (x !== 'examples' && x !== 'spec' && x !== '_'))
    || args._.length > 0
    || !args['spec']
  ) {
    console.error(`usage: swagger-example-gen [--examples=<examples.json>] --spec=<spec.(json|yaml)>`);
    console.error(args);
    return;
  }

  
  let examples = null;
  let exampleFile = args['examples'];
  if (null != exampleFile && fs.existsSync(exampleFile)) {
    examples = JSON.parse(fs.readFileSync(exampleFile, 'utf-8'));
  }
  
  let newExamples = examples || {};

  let specFile = args['spec'];

  console.error(`----- ${specFile}`);
  let spec = (await sway.create({ definition: specFile })).definition;
  console.error(`got spec with ${Object.keys(spec).join(', ')}`);

  newExamples = exemplify(spec, newExamples);

  console.log(JSON.stringify(newExamples, null, 2));
}

function run(argv: string[]): Promise<void> {
  return Promise.resolve(argv).then(runX);
}

run(process.argv.slice(2)).then(() => console.error('done.'), (x) => console.error(x));
