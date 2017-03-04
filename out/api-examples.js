"use strict";
exports.__esModule = true;
var jsf = require("json-schema-faker");
var json_ref_1 = require("@hn3000/json-ref");
var simpletemplate_1 = require("@hn3000/simpletemplate");
var Chance = require("chance");
var chance = new Chance();
function padNumber(n, d) {
    var digits = n.toString(10).length;
    var result = '0000000000000000000000000'.substring(0, Math.max(0, d - digits)) + d;
    return result;
}
jsf.format('date', function (gen, schema) {
    //let result = gen.randexp('^\\d{4}-\\d{2}-\\d{2}$');
    var date = new Date((Math.random() * 2 - 1) * Date.now());
    var result = date.getFullYear() + "-" + padNumber(date.getMonth(), 2) + "-" + padNumber(date.getDate(), 2);
    //console.error(`date schema: ${result} for ${JSON.stringify(schema)}`);
    return result;
});
jsf.format('guid', function (gen, schema) {
    //let guidPattern = schema.pattern || '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$';
    //let result = gen.randexp(guidPattern);
    var result = chance.guid();
    //console.error(`guid schema: ${result} for ${JSON.stringify(schema)}`);
    return result;
});
jsf.format('byte', function (gen, schema) {
    var result = 'VGhpcyBpcyBub3QgYSBmaWxlCg=='; //gen.randexp('^[^]{1}$');
    //console.error(`byte schema: ${result} for ${JSON.stringify(schema)}`);
    return result;
});
jsf.format('phonenumber', function (gen, schema) {
    var pattern = schema.pattern || '\\+[-0-9]{8-12}$';
    var result = gen.randexp(pattern);
    //console.error(`phonenumber schema: ${result} for ${JSON.stringify(schema)}`);
    return result;
});
jsf.format('ip-address', function (gen, schema) {
    var result = [1, 2, 3, 4].map(function () { return Math.round(1 + 254 * Math.random()); }).join('.');
    console.error("ip-address -- you should use ipv4 or ipv6: " + result + " for " + JSON.stringify(schema));
    return result;
});
var queryPropPointer = new json_ref_1.JsonPointer(['properties', 'query', 'properties']);
function exemplify(apiSpec, examples) {
    var result = JSON.parse(JSON.stringify(examples));
    var operationPointers = json_ref_1.JsonPointer.pointers(apiSpec, isOperation);
    for (var _i = 0, operationPointers_1 = operationPointers; _i < operationPointers_1.length; _i++) {
        var opp = operationPointers_1[_i];
        var operation = opp.getValue(apiSpec);
        if (null != result[operation.operationId]) {
            continue;
        }
        var requestSchema = getRequestSchema(operation);
        var responsesSchema = getResponsesSchema(operation);
        var pathTemplate = new simpletemplate_1.Template(opp.get(-2).replace(/{/g, '{{').replace(/}/g, '}}'));
        var queryParams = Object.keys(queryPropPointer.getValue(requestSchema) || {});
        var queryTemplate = new simpletemplate_1.Template(queryParams.map(function (x) { return x + "={{" + x + "}}"; }).join('&'));
        try {
            var exampleRequest = jsf(requestSchema);
            var exampleResponses = jsf(responsesSchema);
            var path = pathTemplate.render(exampleRequest.path || {});
            var query = queryTemplate.render(exampleRequest.query || {});
            var url = path + (query === '' ? '' : '?' + query);
            exampleRequest.url = url;
            examples[operation.operationId] = {
                request: {
                    url: exampleRequest.url,
                    body: exampleRequest.body
                },
                response: exampleResponses
            };
        }
        catch (x) {
            console.error(x);
            examples[operation.operationId] = {
                'x-exception': x.toString(),
                'x-request-schema': requestSchema,
                'x-responses-schema': responsesSchema
            };
        }
    }
    return examples;
}
exports.exemplify = exemplify;
function isOperation(v, p) {
    return p.get(0) === 'paths' && p.keys.length === 3;
}
function isSchema(v, p) {
    //console.log(p.asString());
    return p.get(-1) === 'schema';
}
var paramSchemaAttributes = [
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
function getRequestSchema(operation) {
    var result = {};
    result.type = 'object';
    result.properties = {};
    for (var _i = 0, _a = operation.parameters; _i < _a.length; _i++) {
        var p = _a[_i];
        var schema = null;
        var pp = null;
        switch (p["in"]) {
            case 'body':
                pp = new json_ref_1.JsonPointer([p["in"]]);
                schema = p.schema;
                break;
            case 'query':
            case 'header':
            case 'path':
            case 'formData':
                pp = new json_ref_1.JsonPointer([p["in"], 'properties', p.name]);
                var ps = p;
                schema = {
                    type: ps.type,
                    format: ps.format
                };
                for (var _b = 0, paramSchemaAttributes_1 = paramSchemaAttributes; _b < paramSchemaAttributes_1.length; _b++) {
                    var a = paramSchemaAttributes_1[_b];
                    if (null != ps[a]) {
                        schema[a] = ps[a];
                    }
                }
                break;
        }
        if (pp.getValue(result.properties)) {
            console.error("duplicate parameter " + p.name + " in " + operation.operationId);
        }
        pp.setValue(result.properties, schema, true);
        if (p.required && p["in"] !== 'body') {
            var rp = new json_ref_1.JsonPointer([p["in"], 'required', '-']);
            rp.setValue(result.properties, p.name, true);
        }
    }
    var parts = Object.keys(result.properties);
    result.required = parts;
    for (var _c = 0, parts_1 = parts; _c < parts_1.length; _c++) {
        var i = parts_1[_c];
        result.properties[i].type = 'object';
    }
    return result;
}
function getResponsesSchema(operation) {
    var result = {};
    result.type = 'object';
    result.required = Object.keys(operation.responses).filter(function (x) { return (!operation.responses[x]['x-no-example']); });
    debugger;
    result.properties = result.required.reduce(function (o, x) { return (o[x] = operation.responses[x].schema, o); }, {});
    return result;
}
