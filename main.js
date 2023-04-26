"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var typescript_1 = require("typescript");
function parseProperties(sourceFile, classNames) {
    var classPropertiesMap = new Map();
    function visit(node) {
        if ((typescript_1.default.isClassDeclaration(node) || typescript_1.default.isInterfaceDeclaration(node)) &&
            node.name) {
            var className = node.name.getText(sourceFile);
            if (classNames.includes(className)) {
                var properties_1 = [];
                node.members.forEach(function (member) {
                    var _a;
                    if (typescript_1.default.isPropertyDeclaration(member) ||
                        typescript_1.default.isPropertySignature(member)) {
                        var name_1 = member.name.getText(sourceFile);
                        var type = ((_a = member.type) === null || _a === void 0 ? void 0 : _a.getText(sourceFile)) || "any";
                        properties_1.push({ name: name_1, type: type });
                    }
                });
                classPropertiesMap.set(className, properties_1);
            }
        }
        typescript_1.default.forEachChild(node, visit);
    }
    visit(sourceFile);
    return classPropertiesMap;
}
function generateBuilderClassCode(classPropertiesMap) {
    var builderClassCodeMap = new Map();
    classPropertiesMap.forEach(function (properties, inputClassName) {
        var builderClassName = "".concat(inputClassName, "Builder");
        var code = "class ".concat(builderClassName, " {\n");
        // Generate private properties in the builder class
        properties.forEach(function (_a) {
            var name = _a.name, type = _a.type;
            code += "  private _".concat(name, ": ").concat(type, ";\n");
        });
        code += "\n";
        // Generate constructor with parameters to initialize properties
        code += "  constructor(".concat(properties
            .map(function (_a) {
            var name = _a.name, type = _a.type;
            return "".concat(name, ": ").concat(type);
        })
            .join(", "), ") {\n");
        properties.forEach(function (_a) {
            var name = _a.name;
            code += "    this._".concat(name, " = ").concat(name, ";\n");
        });
        code += "  }\n";
        // Generate with* methods
        properties.forEach(function (_a) {
            var name = _a.name, type = _a.type;
            code += "\n  public with".concat(name.charAt(0).toUpperCase() + name.slice(1), "(").concat(name, ": ").concat(type, "): ").concat(builderClassName, " {\n    this._").concat(name, " = ").concat(name, ";\n    return this;\n  }\n");
        });
        // Generate build method
        code += "\n  public build(): ".concat(inputClassName, " {\n    return new ").concat(inputClassName, "(").concat(properties
            .map(function (_a) {
            var name = _a.name;
            return "this._".concat(name);
        })
            .join(", "), ");\n  }\n");
        code += "}\n";
        builderClassCodeMap.set(inputClassName, code);
    });
    return builderClassCodeMap;
}
function findClassNames(node, sourceFile) {
    var classNames = [];
    function visit(node) {
        if ((typescript_1.default.isClassDeclaration(node) || typescript_1.default.isInterfaceDeclaration(node)) &&
            node.name) {
            classNames.push(node.name.getText(sourceFile));
        }
        typescript_1.default.forEachChild(node, visit);
    }
    visit(node);
    return classNames;
}
function main() {
    var args = process.argv;
    if (args.length < 3) {
        console.error("Missing required argument: Path to class or interface file not provided");
        return;
    }
    var inputClassFilePath = args[2];
    var sourceFile = typescript_1.default.createSourceFile(inputClassFilePath, fs.readFileSync(inputClassFilePath).toString(), typescript_1.default.ScriptTarget.ESNext, true);
    var classNames = findClassNames(sourceFile, sourceFile);
    var classProperties = parseProperties(sourceFile, classNames);
    var builderClassCodeMap = generateBuilderClassCode(classProperties);
    var outputFilePath = args.length === 4 ? args[3] : ".";
    if (outputFilePath.endsWith("/")) {
        outputFilePath = outputFilePath.substring(0, outputFilePath.length - 1);
    }
    if (!fs.existsSync(outputFilePath)) {
        fs.mkdirSync(outputFilePath, { recursive: true });
    }
    // Output each generated builder class code
    builderClassCodeMap.forEach(function (code, className) {
        var fileName = "".concat(outputFilePath, "/").concat(className, "Builder.ts");
        fs.writeFileSync(fileName, code);
        console.log("Generated builder class for ".concat(className, " at ").concat(fileName));
        // console.log(code);
    });
}
main();
