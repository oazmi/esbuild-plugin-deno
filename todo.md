# TODO

## pre-version `0.3.0` todo list

- [ ] npm plugin (it will probably need access to the filesystem, for esbuild to discover it natively)

## pre-version `0.2.0` todo list

- [ ] optional global import map config at top level of the plugin config
- [ ] rename old cached fetch to `memCachedFetch`
- [ ] create a filesystem based cached fetch named `fsCachedFetch`

## pre-version `0.1.1` todo list

- [ ] implement cached fetch for resource caching
- [ ] cached fetch should also retry due to timeout (up to 10 times)
- [ ] cached fetch should also follow redirects (up to 10 times) (or just set `{ redirect: "follow" }` in `fetch` options)

## pre-version `0.1.0` todo list

- [x] import map in `PluginData`
- [x] http plugin
- [ ] jsr plugin
- [ ] contemplate which factory functions could potentially require information on `build.initialOptions.absWorkingDir`
