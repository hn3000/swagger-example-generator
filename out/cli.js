"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var minimist = require("minimist");
var jsonRef = require("@hn3000/json-ref");
var yaml = require("js-yaml");
var api_examples_1 = require("./api-examples");
var fs = require("fs");
var validArgs = [
    'examples',
    'requestExamples',
    'spec',
    'configScript'
];
function runX(argv) {
    return __awaiter(this, void 0, void 0, function () {
        var args, examplesFromFile, exampleFile, examples, requestExamples, responseExamples, specFile, processor, spec;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    args = minimist(argv);
                    if (Object.keys(args).some(function (x) { return (-1 === validArgs.indexOf(x) && x !== '_'); })
                        || args._.length > 0
                        || !args['spec']) {
                        console.error("usage: swagger-example-gen [--examples=<examples.json>] --spec=<spec.(json|yaml)>");
                        console.error(args);
                        return [2 /*return*/];
                    }
                    examplesFromFile = null;
                    exampleFile = args['examples'];
                    if (null != exampleFile && fs.existsSync(exampleFile)) {
                        examplesFromFile = JSON.parse(fs.readFileSync(exampleFile, 'utf-8'));
                    }
                    examples = examplesFromFile || {};
                    requestExamples = args['requestExamples'];
                    if (null == requestExamples)
                        requestExamples = 1;
                    responseExamples = args['responseExamples'];
                    if (null == responseExamples)
                        responseExamples = 1;
                    specFile = args['spec'];
                    console.error("----- " + specFile);
                    processor = new jsonRef.JsonReferenceProcessor(fetchFile);
                    return [4 /*yield*/, processor.expandRef(specFile)];
                case 1:
                    spec = (_a.sent());
                    console.error("got spec with " + Object.keys(spec).join(', '));
                    examples = api_examples_1.exemplify(spec, { examples: examples, requestExamples: requestExamples, responseExamples: responseExamples });
                    console.log(JSON.stringify(examples, null, 2));
                    return [2 /*return*/];
            }
        });
    });
}
function run(argv) {
    return Promise.resolve(argv).then(runX);
}
run(process.argv.slice(2)).then(function () { return console.error('done.'); }, function (x) { return console.error(x); });
function fetchFile(x) {
    return Promise.resolve(x).then(function (x) {
        //console.log("reading ", x, process.cwd());
        var result = fs.readFileSync(x, 'utf-8');
        var sufPos = x.lastIndexOf('.');
        var suffix = sufPos > -1 ? x.substring(sufPos + 1).toLowerCase() : '';
        if (suffix === 'yaml' || suffix === 'yml') {
            //console.warn(`warn: yaml not supported (${x})`);
            result = yaml.safeLoad(result);
        }
        else if (suffix === 'json') {
            if (result.charAt(0) === '\uFEFF') {
                console.warn("stripping BOM from " + x);
                result = result.substr(1);
            }
        }
        else if (suffix !== 'json') {
            console.warn("warn: " + suffix + " not supported (" + x + ")");
        }
        return result;
    });
}
