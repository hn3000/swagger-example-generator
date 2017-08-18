
import * as minimist from 'minimist';
import * as jsonRef from '@hn3000/json-ref';
import * as yaml from 'js-yaml';

import { exemplify } from './api-examples'
import * as fs from 'fs';

const validArgs = [
  'examples',
  'requestExamples',
  'spec',
  'configScript'
];

async function runX(argv: string[]): Promise<void> {
  let args = minimist(argv);

  if (
    Object.keys(args).some((x) => (-1 === validArgs.indexOf(x) && x !== '_'))
    || args._.length > 0
    || !args['spec']
  ) {
    console.error(`usage: swagger-example-gen [--examples=<examples.json>] --spec=<spec.(json|yaml)>`);
    console.error(args);
    return;
  }


  let examplesFromFile = null;
  let exampleFile = args['examples'];
  if (null != exampleFile && fs.existsSync(exampleFile)) {
    examplesFromFile = JSON.parse(fs.readFileSync(exampleFile, 'utf-8'));
  }

  let examples = examplesFromFile || {};

  let requestExamples = args['requestExamples'];
  if (null == requestExamples) requestExamples = 1;

  let responseExamples = args['responseExamples'];
  if (null == responseExamples) responseExamples = 1;

  let specFile = args['spec'];

  console.error(`----- ${specFile}`);
  //let spec = (await sway.create({ definition: specFile })).definition;
  let processor = new jsonRef.JsonReferenceProcessor(fetchFile);
  let spec = (await processor.expandRef(specFile));


  console.error(`got spec with ${Object.keys(spec).join(', ')}`);

  examples = exemplify(spec, { examples, requestExamples, responseExamples });

  console.log(JSON.stringify(examples, null, 2));
}

function run(argv: string[]): Promise<void> {
  return Promise.resolve(argv).then(runX);
}

run(process.argv.slice(2)).then(() => console.error('done.'), (x) => console.error(x));

function fetchFile(x:string): Promise<string|any> {
  return Promise.resolve(x).then(x => {
    //console.log("reading ", x, process.cwd());
    let result = fs.readFileSync(x, 'utf-8');
    let sufPos = x.lastIndexOf('.');
    const suffix = sufPos > -1 ? x.substring(sufPos+1).toLowerCase() : '';
    if (suffix === 'yaml' || suffix === 'yml') {
      //console.warn(`warn: yaml not supported (${x})`);
      result = yaml.safeLoad(result);
    } else if (suffix === 'json') {
      if (result.charAt(0) === '\uFEFF') {
        console.warn(`stripping BOM from ${x}`);
        result = result.substr(1);
      }
    } else if (suffix !== 'json') {
      console.warn(`warn: ${suffix} not supported (${x})`);
    }
    return result;
  });
}
