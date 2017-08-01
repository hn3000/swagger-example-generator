import * as SwaggerSchema from 'swagger-schema-official';

import jsf = require('json-schema-faker');

import { JsonPointer } from '@hn3000/json-ref';

import { Template } from '@hn3000/simpletemplate';

import Chance = require('chance');

let chance = new Chance();

interface IGenerators {
  faker: any;
  chance: any;
  randexp: (re: string) => any;
}

function padNumber(n:number, d:number) {
  let digits = n.toString(10).length;
  let result = '0000000000000000000000000'.substring(0, Math.max(0, d-digits)) + d;

  return result;
}

jsf.format('date', (gen: IGenerators, schema: any) => {
  //let result = gen.randexp('^\\d{4}-\\d{2}-\\d{2}$');
  let date = new Date((Math.random()*2-1)*Date.now());
  let result = `${date.getFullYear()}-${padNumber(date.getMonth(),2)}-${padNumber(date.getDate(),2)}`;
  //console.error(`date schema: ${result} for ${JSON.stringify(schema)}`);
  return result;
});

jsf.format('guid', (gen: IGenerators, schema: any) => {
  let guidPattern = schema.pattern || '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$';
  //let result = gen.randexp(guidPattern);
  //let result = chance.guid();
  let result = '54686973-2069-7320-6a75-737420616e20';
  if (!new RegExp(guidPattern).test(result)) {
    console.error("fixed guid example does not match pattern")
  }
  //console.error(`guid schema: ${result} for ${JSON.stringify(schema)}`);
  return result;
});

jsf.format('byte', (gen: IGenerators, schema: any) => {
  let result = 'VGhpcyBpcyBub3QgYSBmaWxlCg=='; //gen.randexp('^[^]{1}$');
  //console.error(`byte schema: ${result} for ${JSON.stringify(schema)}`);
  return result;
});

jsf.format('phonenumber', (gen: IGenerators, schema: any) => {
  let pattern = schema.pattern || '\\+[-0-9]{8-12}$';
  let result = gen.randexp(pattern);
  //console.error(`phonenumber schema: ${result} for ${JSON.stringify(schema)}`);
  return result;
});

jsf.format('ip-address', (gen: IGenerators, schema: any) => {
  let result = [1,2,3,4].map(() => Math.round(1+254*Math.random())).join('.');
  console.error(`ip-address -- you should use ipv4 or ipv6: ${result} for ${JSON.stringify(schema)}`);
  return result;
})

export interface IApiExampleRequest {
  url: string;
  body: any;
}

export interface IApiExample {
  request?: IApiExampleRequest;
  response?: {
    [status:string]: any;
  };
  'x-exception'?: any;
  'x-request-schema'?: any;
  'x-responses-schema'?: any;
}

export interface IApiExampleData {
  [operationId:string]: IApiExample;
}

const queryPropPointer = new JsonPointer(['properties', 'query', 'properties']);

export function exemplify(apiSpec: SwaggerSchema.Spec, examples: IApiExampleData): IApiExampleData {
  let result: any = JSON.parse(JSON.stringify(examples));

  let operationPointers = JsonPointer.pointers(apiSpec, isOperation);

  for (let opp of operationPointers) {
    let operation = opp.getValue(apiSpec) as SwaggerSchema.Operation;
    let operationId = operation.operationId;

    if (null == operationId) {
      operationId = opp.keys.slice(1).join('_').replace(/[\/]/g, '_');
    }

    if (null != result[operationId]) {
      continue;
    }

    let requestSchema = getRequestSchema(operation);
    let responsesSchema = getResponsesSchema(operation);

    let pathTemplate = new Template(opp.get(-2).replace(/{/g, '{{').replace(/}/g, '}}'));

    let queryParams = Object.keys(queryPropPointer.getValue(requestSchema)||{});
    let queryTemplate = new Template(queryParams.map((x) => `${x}={{${x}}}`).join('&'));
    try {
      let exampleRequest = jsf(requestSchema);
      let exampleResponses = jsf(responsesSchema);

      let path = pathTemplate.render(exampleRequest.path || {});
      let query = queryTemplate.render(exampleRequest.query || {});

      let url = path + (query === '' ? '' : '?' + query);

      exampleRequest.url = url;

      examples[operationId] = {
        request: {
          url: exampleRequest.url,
          body: exampleRequest.body
        },
        response: exampleResponses
      };
    } catch (x) {
      console.error(x);
      examples[operationId] = {
        'x-exception': x.toString(),
        'x-request-schema': requestSchema,
        'x-responses-schema': responsesSchema
      };
    }
  }

  return examples;
}

function isOperation(v: any, p: JsonPointer): boolean {
  return p.get(0) === 'paths' && p.keys.length === 3;
}

function isSchema(v: any, p: JsonPointer): boolean {
  //console.log(p.asString());
  return p.get(-1) === 'schema';
}

const paramSchemaAttributes = [
  "format",
  "title",
  "description",
  "default",
  "multipleOf",
  "maximum",
  "exclusiveMaximum",
  "minimum",
  "exclusiveMinimum",
  "maxLength",
  "minLength",
  "pattern",
  "maxItems",
  "minItems",
  "uniqueItems",
  "maxProperties",
  "minProperties",
  "enum",
  "type",
  "items"
];

function getRequestSchema(operation: SwaggerSchema.Operation): SwaggerSchema.Schema {
  let result: SwaggerSchema.Schema = {};
  result.type = 'object';
  result.properties = { };

  const parameters = operation.parameters || [];

  for (let p of parameters) {
    let schema: SwaggerSchema.Schema = null;
    let pp: JsonPointer = null;
    switch (p.in) {
      case 'body':
        pp = new JsonPointer([p.in]);
        schema = (p as SwaggerSchema.BodyParameter).schema;
        break;
      case 'query':
      case 'header':
      case 'path':
      case 'formData':
        pp = new JsonPointer([p.in, 'properties', p.name]);
        let ps = p as SwaggerSchema.FormDataParameter;
        schema = {
          type: ps.type,
          format: ps.format
        };
        for (let a of paramSchemaAttributes) {
          if (null != ps[a]) {
            schema[a] = ps[a];
          }
        }
        break;
    }
    if (pp.getValue(result.properties)) {
      console.error(`duplicate parameter ${p.name} in ${operation.operationId}`);
    }
    pp.setValue(result.properties, {...schema}, true);
    if (p.required && p.in !== 'body') {
      let rp = new JsonPointer([p.in, 'required', '-']);
      rp.setValue(result.properties, p.name, true);
    }
  }

  let parts = Object.keys(result.properties);
  result.required = parts as [string];
  for (let i of parts) {
    result.properties[i] = {...result.properties[i], type: 'object' };
  }


  return result;
}

function getResponsesSchema(operation: SwaggerSchema.Operation): SwaggerSchema.Schema {
  let result: SwaggerSchema.Schema = {};
  result.type = 'object';
  result.required = Object.keys(operation.responses).filter((x) => (!operation.responses[x]['x-no-example'])) as any;
  result.properties = result.required.reduce((o,x) => (o[x] = operation.responses[x].schema,o), {});

  return result;
}