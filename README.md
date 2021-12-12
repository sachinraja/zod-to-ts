# ts-lib-starter

Boilerplate for your next TypeScript library. Build with speed and efficiency.

## Features

### [pnpm](https://pnpm.io/)

A fast and efficient package manager. Packages are linked from a single, global store.

### [tsup](https://tsup.egoist.sh/)

A quick, easy-to-use, and zero config bundler powered by esbuild. This allows for dual publishing esmodules and commonjs. It also produces only one dts file for each entrypoint.

### [Jest](https://jestjs.io/)

A testing framework. Uses [swc](https://swc.rs/) for transpiling TypeScript, look through the swc docs if you need to add features to the transpiler such as jsx. Since this uses `--experimental-vm-modules` for esm, you cannot mock modules in the normal way. You can currently use [`jest.unstable_mockModule`](https://github.com/facebook/jest/issues/9430#issuecomment-915109139), but it may change later.

### [dprint](https://dprint.dev/)

A pluggable and configurable code formatting platform written in Rust. Faster alternative to Prettier.

### [ESLint](https://eslint.org/) and [TypeScript ESLint](https://typescript-eslint.io/)

Linter that helps you find problems in your code.

### [npm-run-all](https://github.com/mysticatea/npm-run-all)

Run dprint, TypeScript, and ESLint checks in parallel.

### [Github Actions](https://github.com/features/actions)

Run all your checks on each commit.

### pre-commit hook

Uses [husky](https://typicode.github.io/husky/#/) to register a pre-commit hook and [lint-staged](https://github.com/okonet/lint-staged) to run commands only on changed files.

Ensure all files are formatted before they are committed and run linters on changed files.

### [Renovate](https://www.whitesourcesoftware.com/free-developer-tools/renovate/)

Automatically opens PRs to update dependencies. Automerges patch and minor updates, but not major updates or any `typescript` updates. Also pins all `devDependencies`) to use exact versions (**no** `^` before version signifying that the latest patch version can be matched, only the version specified can be used).

## Usage

This is esm-first, meaning you write esm and it is transpiled to both esm and cjs. For example, use:

```ts
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
```

instead of `__dirname`.

### Setup

1. [Install pnpm](https://pnpm.io/installation)

2. [Grant Renovate access to your GitHub repos](https://github.com/marketplace/renovate)

3. Copy the repo, replace `mypackage` with your repository name:

```
pnpx degit sachinraja/ts-lib-starter mypackage && cd mypackage
```

4. Search and replace all instances of `ts-lib-starter` with your package name. Remove `LICENSE` or replace it with your own.

5. Install dependencies:

```
pnpm i
```

6. Lint package:

```
pnpm lint
```

7. Test package:

```
pnpm t
```

Note that there is a workflow in `.github/workflows/test.yml` that will run on each commit if you push it to GitHub.

### Publishing

Run `pnpm publish` to publish the package. Make sure the version is what you want to publish before publishing. Building the package (in a `prepublishOnly` script) and setting the relevant `package.json` attributes are already done. Note that [`sideEffects`](https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free) is set to `false`, so bundlers like Webpack can tree shake the package:

> A "side effect" is defined as code that performs a special behavior when imported, other than exposing one or more exports. An example of this are polyfills, which affect the global scope and usually do not provide an export.

### Entry Points

An entry point is a path that modules from your package can be imported from. The default entry point for this starter is `.`, which simply means that `src/index.ts` can be imported as `ts-lib-starter` (your package name).

If you want to add an entrypoint, you must do the following:

1. Specify the path you want to users to import your module from. For this example, I will use the file `src/constants.ts` and expose the entry point as `ts-lib-starter/constants`. Add the following in `package.json` exports:

```jsonc
"exports": {
    ".": {
        // ...
    },
    "./constants": {
        "import": "./dist/constants.js",
        "default": "./dist/constants.cjs"
    }
}
```

This exposes the module to users in multiple formats. `import` is used when a user uses an esm import for the entry point. `default` is used in any other case (i.e. a cjs `require`).

2. Add the file to the `tsup` build in the `package.json` config:

```diff
{
  "tsup": {
    "entryPoints": [
      "src/index.ts",
+     "src/constants.ts"
    ]
    "format": [
      "esm",
      "cjs"
    ],
    "dts": {
      "resolve": true
    },
    "splitting": true
  }
}
```

Note the options here. `format` specifies for the package to be bundled in both esm and cjs, which allows for a dual publish. `dts.resolve` is used to bundle types for `devDependencies`. For example, if you use a TypeScript utilities package, such as [`ts-essentials`](https://github.com/krzkaczor/ts-essentials), the types will be bundled (in the `.d.ts` files) to avoid a dependency on `ts-essentials`. `splitting` enables an experimental feature that allows for creating chunks with cjs. This helps to avoid duplicating code with a package with multiple entry points.

The `entryPoints` (`src/index.ts` and `src/constants.ts`), specify the files that are our entry points, so when you add an entry point, it must also be added to the `build` config like before.
