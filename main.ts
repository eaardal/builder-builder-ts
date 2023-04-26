import * as fs from "fs";
import ts from "typescript";

interface Property {
  name: string;
  type: string;
}

function parseProperties(
  sourceFile: ts.SourceFile,
  classNames: string[]
): Map<string, Property[]> {
  const classPropertiesMap = new Map<string, Property[]>();

  function visit(node: ts.Node) {
    if (
      (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) &&
      node.name
    ) {
      const className = node.name.getText(sourceFile);
      if (classNames.includes(className)) {
        const properties: Property[] = [];

        node.members.forEach((member) => {
          if (
            ts.isPropertyDeclaration(member) ||
            ts.isPropertySignature(member)
          ) {
            const name = member.name.getText(sourceFile);
            const type = member.type?.getText(sourceFile) || "any";
            properties.push({ name, type });
          }
        });

        classPropertiesMap.set(className, properties);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return classPropertiesMap;
}

function generateBuilderClassCode(
  classPropertiesMap: Map<string, Property[]>
): Map<string, string> {
  const builderClassCodeMap = new Map<string, string>();

  classPropertiesMap.forEach((properties, inputClassName) => {
    const builderClassName = `${inputClassName}Builder`;
    let code = `class ${builderClassName} {\n`;

    // Generate private properties in the builder class
    properties.forEach(({ name, type }) => {
      code += `  private _${name}: ${type};\n`;
    });

    code += "\n";

    // Generate constructor with parameters to initialize properties
    code += `  constructor(${properties
      .map(({ name, type }) => `${name}: ${type}`)
      .join(", ")}) {\n`;
    properties.forEach(({ name }) => {
      code += `    this._${name} = ${name};\n`;
    });
    code += "  }\n";

    // Generate with* methods
    properties.forEach(({ name, type }) => {
      code += `
  public with${
    name.charAt(0).toUpperCase() + name.slice(1)
  }(${name}: ${type}): ${builderClassName} {
    this._${name} = ${name};
    return this;
  }\n`;
    });

    // Generate build method
    code += `
  public build(): ${inputClassName} {
    return new ${inputClassName}(${properties
      .map(({ name }) => `this._${name}`)
      .join(", ")});
  }\n`;

    code += "}\n";

    builderClassCodeMap.set(inputClassName, code);
  });

  return builderClassCodeMap;
}

function findClassNames(node: ts.Node, sourceFile: ts.SourceFile): string[] {
  let classNames: string[] = [];

  function visit(node: ts.Node) {
    if (
      (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) &&
      node.name
    ) {
      classNames.push(node.name.getText(sourceFile));
    }
    ts.forEachChild(node, visit);
  }

  visit(node);
  return classNames;
}

function main(): void {
  const args = process.argv;

  if (args.length < 3) {
    console.error(
      "Missing required argument: Path to class or interface file not provided"
    );
    return;
  }

  const inputClassFilePath = args[2];

  const sourceFile = ts.createSourceFile(
    inputClassFilePath,
    fs.readFileSync(inputClassFilePath).toString(),
    ts.ScriptTarget.ESNext,
    true
  );

  const classNames = findClassNames(sourceFile, sourceFile);
  const classProperties = parseProperties(sourceFile, classNames);
  const builderClassCodeMap = generateBuilderClassCode(classProperties);

  let outputFilePath = args.length === 4 ? args[3] : ".";
  if (outputFilePath.endsWith("/")) {
    outputFilePath = outputFilePath.substring(0, outputFilePath.length - 1);
  }

  if (!fs.existsSync(outputFilePath)) {
    fs.mkdirSync(outputFilePath, { recursive: true });
  }

  // Output each generated builder class code
  builderClassCodeMap.forEach((code, className) => {
    const fileName = `${outputFilePath}/${className}Builder.ts`;
    fs.writeFileSync(fileName, code);
    console.log(`Generated builder class for ${className} at ${fileName}`);
    // console.log(code);
  });
}

main();
