# TODO

## pre-version `0.4.0` todo list

- [ ] add granulated tests for each plugin, and combination of plugins (for intertwined path resolution)

## pre-version `0.3.0` todo list

- [ ] npm plugin (it will probably need access to the filesystem, for esbuild to discover it natively)

## pre-version `0.2.0` todo list

- [x] optional global import map config at top level of the "all-in-one" plugin config
- [ ] rename old cached fetch to `memCachedFetch`
- [ ] create a filesystem based cached fetch named `fsCachedFetch`

## pre-version `0.1.1` todo list

- [x] create an "all-in-one" plugin that is a combination of all of the plugins.
- [ ] implement cached fetch for resource caching
- [ ] cached fetch should also retry due to timeout (up to 10 times)
- [ ] cached fetch should also follow redirects (up to 10 times) (or just set `{ redirect: "follow" }` in `fetch` options)

## (2025-02-10) pre-version `0.1.0` todo list

- [x] import map in `PluginData`
- [x] inside of `resolvePathFromImportMap`, we should normalize the input `path` first (see [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap#module_specifier_map:~:text=A%20module%20specifier%20of%20./foo/../js/app.js%20would%20be%20resolved%20to%20./js/app.js%20before%20matching)).
      moreover, I think we are supposed to also normalize the import keys, except for the initial dot-slash "./" (or lack-thereof).
      but I'll have to look into the specification carefully to deduce that, since it isn't made clear at the surface level.
- [x] http plugin
- [x] jsr plugin
- [x] import-map plugin
- [ ] contemplate which factory functions could potentially require information on `build.initialOptions.absWorkingDir`
