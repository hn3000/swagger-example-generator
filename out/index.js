"use strict";
exports.__esModule = true;
var jsf = require("json-schema-faker");
var json_ref_1 = require("@hn3000/json-ref");
function isSchema(v, p) {
    //console.log(p.asString());
    return p.get(-1) === 'schema';
}
jsf.format('date', function (gen, schema) {
    //let result = gen.randexp('^\\d{4}-\\d{2}-\\d{2}$');
    var date = new Date((Math.random() * 2 - 1) * Date.now());
    var result = date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
    console.log("date schema: " + result + " for " + JSON.stringify(schema));
    return result;
});
jsf.format('guid', function (gen, schema) {
    var result = gen.randexp('^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$');
    console.log("guid schema: " + result + " for " + JSON.stringify(schema));
    return result;
});
jsf.format('byte', function (gen, schema) {
    var result = '...'; //gen.randexp('^[^]{1}$');
    //console.log(`byte schema: ${result} for ${JSON.stringify(schema)}`);
    return result;
});
jsf.format('phonenumber', function (gen, schema) {
    var result = gen.randexp('[+][-0-9]{8-12}$');
    console.log("phonenumber schema: " + result + " for " + JSON.stringify(schema));
    return result;
});
function exemplify(apiSpec) {
    var schemaPaths = json_ref_1.JsonPointer.pointers(apiSpec, isSchema);
    var examples = {};
    console.log("found " + schemaPaths.length + " schema instances");
    for (var _i = 0, schemaPaths_1 = schemaPaths; _i < schemaPaths_1.length; _i++) {
        var p = schemaPaths_1[_i];
        var schema = p.getValue(apiSpec);
        try {
            var example = jsf(schema);
            examples[p.asString()] = example;
        }
        catch (x) {
            examples[p.asString()] = {
                'x-exception': x,
                'x-schema': schema
            };
        }
    }
    return examples;
}
exports.exemplify = exemplify;
