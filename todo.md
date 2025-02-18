# TODO

## bucket list

- [ ] support for deno and node workspaces.
- [ ] support for `scopes` in `deno.json` (I haven't got a clue as to what it does anyway).
- [ ] ~~add a plugin that add support for custom mime type declaration via `import "xyz" with { mime: "my-mime/type" }`.~~
  > better yet, see the generalized approach in the task below:
- [ ] add a custom build-options/load-options plugin that can set a custom loader (or perform a separate bundle-build) based on the "with" import attributes.
- [ ] create a stub `esbuild.PluginBuild` object that can be used for testing the `onResolve` calls of individual plugins.
      this would allow for the creation of unit tests, and also provide the plugin users with a better understanding of how the resource resolution works.

## pre-version `0.4.0` todo list

- [ ] add granulated tests for each plugin, and combination of plugins (for intertwined path resolution)

## pre-version `0.3.0` todo list

- [ ] npm-package download plugin (it will probably need access to the filesystem, for esbuild to discover it natively)

## pre-version `0.2.0` todo list

- [x] optional global import map config at top level of the "all-in-one" plugin config
- [ ] a function to detect the current runtime, so that it can be later used for predicting the base-project-level scope's `runtimePackage: RuntimePackage` (i.e. is it a `package.json(c)` or `deno.json(c)` or `jsr.json(c)`).
- [ ] ~~rename old cached fetch to `memCachedFetch`~~
  > will not implement right now (maybe in the future).
- [ ] ~~create a filesystem based cached fetch named `fsCachedFetch`~~
  > will not implement right now (maybe in the future).
- [ ] the jsr plugin setup should accept `runtimePackage: DenoPackage | URL | string` configuration option for specifying the current scope/project's `deno.json` file (if there's one).
- [ ] in either the `jsrPlugin` or a new `npmPlugin`, we should install npm packages via deno, by tricking it into importing the package and storing it into local `node_modules` folder (which WILL require `"nodeModulesDir": "auto"` in the top-level package's `deno.json`) in the following way:
  ```ts
  const dynamic_export_script = `export * as myLib from "npm:@${pkg.scope}/${pkg.name}@${pkg.version}"`
  const dynamic_export_script_blob = new Blob([dynamic_export_script], { type: "text/javascript" })
  const dynamic_export_script_url = URL.createObjectURL(dynamic_export_script_blob)
  const phony_importer = await import(dynamic_export_script_url)
  ```
  on the other hand, if the `npm` command is available on the host system, then we can also execute `npm install pkg-name --save-optional` (via `import { exec } from "node:child_process"; await exec("...")`) if it is not already present in `package.json`, or just `npm install pkg-name` if it is present in `package.json`.

## (2025-02-14) pre-version `0.1.2` todo list

- [x] create an `npmSpecifierPlugin` that only strips away the `"npm:"` prefix from an import path, and leaves it up to esbuild to take care of the full-path resolution and loading.
      ~~but if we do end up having to do the full-path resolution ourselves (to replicate esbuild's operation), we will need to assume that `node_modules` exists in the current-working-directory (i.e. `getCwd()`), and NOT esbuild's `absWorkingDir` build option.~~
  > most of this concern does not matter, since esbuild happily resolves the node-resolution-path starting with the `resolveDir` path argument provided to the built-in resolver function, and it works its way upwards, searching for the `node_modules` folder, and then searching for the package in each.
- [x] the `denoPlugins` should accept a `getCwd: () => string` configuration option, and base its path resolver function around it.
- [x] if `DenoPluginsConfig.getCwd` is `undefined`, then, by default, it will try detecting the runtime environment to pick from one of:
  - `() => process.cwd()` (for node and bun)
  - `() => Deno.cwd()` (for deno)
  - `() => window.location.href` (for browsers)
  - `() => request.origin` (for cloudflare workers (but how will we provide it a `request: Request` object statically?))
  > this got implemented in [`jsr:@oazmi/kitchensink@0.9.7/crossenv`](https://github.com/omar-azmi/kitchensink_ts/commit/7eab48b1fe8f6f9473ee3e9bfd06ff6cfafec6b5), and was imported here as a dependency.
- [x] add the jsr `"@std/*"` dependencies to the `packageJson.bundledDependencies` field of `deno.json`, because npm does not permit packing of the `.npmrc` file, no matter what.
      as a result, the client downloading our package will never be able to resolve installation of `@std/jsonc` and `@std/semver`.
      thus, we bundle these dependencies in our packed npm-distribution.
      one unfortunate consequence is that it explodes the number of distribution files to `450+`, instead of just `55` files.

## (2025-02-11) pre-version `0.1.1` todo list

- [x] create an "all-in-one" plugin that is a combination of all of the plugins.
- [x] implement cached fetch for resource caching.
  > I'm just using `{ cache: "force-cache" }` in every `fetch` call.
  > but I may need a more abstract caching strategy if I plan on caching on the filesystem as well
  > via `memCachedFetch` that I may or may not introduce in version `0.2.0`.
- [x] ~~cached fetch should also retry due to timeout (up to 10 times)~~
  > I don't see the need for this, since http is designed to retry in case of a corrupted response.
- [x] cached fetch should also follow redirects ~~(up to 10 times)~~ (or just set `{ redirect: "follow" }` in `fetch` options)

## (2025-02-10) pre-version `0.1.0` todo list

- [x] import map in `PluginData`
- [x] inside of `resolvePathFromImportMap`, we should normalize the input `path` first (see [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap#module_specifier_map:~:text=A%20module%20specifier%20of%20./foo/../js/app.js%20would%20be%20resolved%20to%20./js/app.js%20before%20matching)).
      moreover, I think we are supposed to also normalize the import keys, except for the initial dot-slash "./" (or lack-thereof).
      but I'll have to look into the specification carefully to deduce that, since it isn't made clear at the surface level.
- [x] http plugin
- [x] jsr plugin
- [x] import-map plugin
- [ ] contemplate which factory functions could potentially require information on `build.initialOptions.absWorkingDir`
