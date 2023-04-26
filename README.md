# BuilderBuilder

Generates builder-classes from plain TypeScript classes or interfaces, following conventions from the classic Builder design pattern.

All logic written by ChatGPT.

Example:

```typescript
// Input class (also works on interfaces):
export class Foo {
  public aaa: string = "aaa";
  public bbb: number = 111;
}

// Generated builder:
class FooBuilder {
  private _aaa: string;
  private _bbb: number;

  constructor(aaa: string, bbb: number) {
    this._aaa = aaa;
    this._bbb = bbb;
  }

  public withAaa(aaa: string): FooBuilder {
    this._aaa = aaa;
    return this;
  }

  public withBbb(bbb: number): FooBuilder {
    this._bbb = bbb;
    return this;
  }

  public build(): Foo {
    return new Foo(this._aaa, this._bbb);
  }
}
```

## Usage

Install everything:

```
npm install
```

Using by running the source code:

```
npm run generate <path to typescript file containing class(es)> <output path (optional)>

// Example running with testdata in this repo:
npm run generate ./testdata/FooClass.ts ./testdata/output
```

Using by running a built executable:

```
// Build TypeScript to JavaScript
npm run build

// Package built JavaScript into a executable NodeJS app
npm run package

./bin/<your OS>/builderbuilder ./testdata/FooClass.ts
```

Move the built executable to your PATH:

```
cp ./bin/<your OS>/builderbuilder <your destination>

// Example:
cp ./bin/macos/builderbuilder ~/dev/apps/builderbuilder (where ~/dev/apps is already on my PATH)
```

## Known issues

- The script does not handle import statements to the class it's building.
