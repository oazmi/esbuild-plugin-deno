# TODO

## bucket list

- [ ] support for deno and node workspaces.
- [ ] support for `scopes` in `deno.json` (I haven't got a clue as to what it does anyway).

## pre-version `0.4.0` todo list

- [ ] add granulated tests for each plugin, and combination of plugins (for intertwined path resolution)

## pre-version `0.3.0` todo list

- [ ] npm plugin (it will probably need access to the filesystem, for esbuild to discover it natively)

## pre-version `0.2.0` todo list

- [x] optional global import map config at top level of the "all-in-one" plugin config
- [ ] rename old cached fetch to `memCachedFetch`
- [ ] create a filesystem based cached fetch named `fsCachedFetch`
- [ ] the jsr plugin setup should accept `runtimePackage: DenoPackage | URL | string` configuration option for specifying the current scope/project's `deno.json` file (if there's one).

## pre-version `0.1.2` todo list

- [ ] the `DenoPlugins` should accept a `getCwd: () => string` configuration option, and base its path resolver function around it.
- [ ] if `DenoPluginsConfig.getCwd` is `undefined`, then, by default, it will try detecting the runtime environment to pick from one of:
  - `() => process.cwd()` (for node and bun)
  - `() => Deno.cwd()` (for deno)
  - `() => window.location.href` (for browsers)
  - `() => request.origin` (for cloudflare workers (but how will we provide it a `request: Request` object statically?))
- [ ] a function to detect the current runtime, so that it can be later used for predicting the base-project-level scope's `runtimePackage: RuntimePackage` (i.e. is it a `package.json(c)` or `deno.json(c)` or `jsr.json(c)`).

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
