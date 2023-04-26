# BuilderBuilder

Generates builder-classes from plain TypeScript classes, following conventions from the classic Builder design pattern.

All logic written by ChatGPT.

Example:

```typescript
// Input class:
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

```
npm run build <path to typescript file containing class(es)> <output path (optional)>

// Example running with testdata in this repo:
npm run build ./testdata/FooClass.ts ./testdata
```

## Known issues

- The script does not handle import statements to the class it's building.
