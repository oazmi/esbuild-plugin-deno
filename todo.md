# TODO

## bucket list

- [ ] support for deno and node workspaces.
  > give this more priority, as it's starting to become annoying when I have to temporarily flatten dependencies of valrious local deno packages into a single package,
  > so that the bundle script is able to resolve imports of the other local packages.
- [ ] support for `scopes` in `deno.json` (I haven't got a clue as to what it does anyway).
- [ ] ~~add a plugin that add support for custom mime type declaration via `import "xyz" with { mime: "my-mime/type" }`.~~
  > better yet, see the generalized approach in the task below:
- [ ] add a custom build-options/load-options plugin that can set a custom loader (or perform a separate bundle-build) based on the "with" import attributes.
- [ ] create a stub `esbuild.PluginBuild` object that can be used for testing the `onResolve` calls of individual plugins.
      this would allow for the creation of unit tests, and also provide the plugin users with a better understanding of how the resource resolution works.
- [x] (2025-03-02) prototype a new `node_modules` resolver plugin that can be namespaced and provide a full node-module-resolution, without actually implementing the directory scanning algorithm.
      we'll do this sneakily by calling `build.esbuild.build()` inside the `build.onResolve`'s callback,
      and set the build args to: `entryPoints = ["node-module path to resolve"]`, `absWorkingDir = "the original absWorkingDir`,
      in addition to inserting an `onLoad` plugin into the build args that captures the full path (`args.path`) and the resolution-directory (`args.resolveDir`).
      after that, the `onLoad` plugin will simply return a dummy string content (or just use the `loader: "empty"` for its result),
      and our namespaced node-module-resolution plugin will now have access to the full resolved `path` and `resolveDir`.
- [ ] in the future, create an optional path-resolution caching mechanism to speed up path-resolution of follow-up builds.
  - each input-resource will acquire a pseudo-unique key that will be computed based on the resource's `args'path`, `args.resolveDir`, `args.importer`, and maybe also `args.namespace`.
  - in theory, the key should also be computed based on the `args.pluginData`, since the pluginData does influence the end result.
    however, it unrealistic for scenario to occur where a resource has all identical fields in `args`, except for a mismatching `pluginData` field.
    thus, for simplicity let's ignore encoding `pluginData` into the key.
  - now, the cache will not only store the resolved path, but also the `pluginData`, since it contains essential information to resolve packages.
    but now we run into another problem, and that is, the `pluginData` will need to be serializable, so that it can be reconstructed perfectly, and also instantiate the correct object classes (such as instances of `RuntimePackage` or `DenoPackage`).
    this will create too much complexity, so perhaps the alternate approach in the next bullet point may be more appropriate.
  - how about we _only_ cache resolved resources that either have not `pluginData` (such as resolved npm-packages),
    or very basic `pluginData` that is disposable once the resource has been resolved (i.e. the `pluginData`'s inheritance will not change the dependencies' path-resolution).
    this way, npm-package (which are almost always the bottle-neck for path-resolution of most projects) will always be cached, and follow up builds will not take as much time since filesystem read/scanning will be skipped.
    moreover, we will not have to store/serialize any `pluginData` since it will be lacking any useful info, and just storing the final resolved path will suffice.
  - don't forget: this path-resolution cache mechanism will need to exist inside of the entry-plugin,
    since this is the only plugin that has inspection capabilities over all inputs and over all finalized outputs/resolved-results.
  - moreover, the end user will need to have filesystem access to store the cache so that it can be reloaded upon a new build.
    in fact, the `cacheLoad` and `cacheStore`/`cacheSave` options in the config should be async functions that the user should provide and implement on their own.
    this way, the user will have freedom over how they wish to store the cache.
    - `cacheLoad: () => Promise<PathResolutionCacheDict>`
    - `cacheSave: (cache: PathResolutionCacheDict) => Promise<void>`
- [ ] I noticed that deno can natively import arbitrary text files as strings when the `import "..." with { type: "string" }` import-attribute is used.
      I should probably also add this as a supported feature in the future.
      see the following deno pull-request for more details about this feature: [deno_core/pull/402](https://github.com/denoland/deno_core/pull/402)
- [ ] In the far future, add a web-compatible simple npm-package fetcher and loader, which will fetch package tarballs from [npmjs.org](http://registry.npmjs.org/),
      and then create a virtual filesystem to resolve requested resources from the package.
      doing this will definitely require us to create a `class NodePackage extends RuntimePackage { ... }`,
      since we will need to resolve the "package.json" dependencies ourselves.
      for the tarball decoding, don't forget to use the [tar codec](https://github.com/omar-azmi/fbicodec_ts/blob/main/examples/tar_parser.ts) from your fbicodec library.
- [ ] add new options to `autoInstall` that prompts the user (via `alert()`) if they wish to install the missing npm-package (and also let them know the installation directory).

## issues list

- [ ] esbuild's default loaders (in the file namespace) do not propagate the `pluginData` provided by the resolver.
      as a result, we may lose our `pluginData.runtimePackage` if a filesystem file is loaded via the default loader.
      (this will not be an issue if we trancend to our http-plugin's namespace (via `file://` uri) first).
      maybe I should make a feature request on esbuild's github page to allow for the propagation of pluginData for the default loaders.

## pre-version `0.5.0` todo list

- [ ] add granulated tests for each plugin, and combination of plugins (for intertwined path resolution)

## pre-version `0.4.x` todo list

- [ ] (breaking) instead of the declaring your own `nodeModuleDirs` in the config options of the npm-plugin,
      you should acquire them from `build.initialOptions.nodePaths` (read more about it [here](https://esbuild.github.io/api/#node-paths)).
      furthermore, you can improve the `nodeModulesResolverFactory` function to allow scanning in multiple directories by utilizing the `nodePaths` build options.
- [ ] allow the customization of the http-header, cache policy, and redirect policy for the http plugin.
      some CDNs, such as [esm.sh](https://esm.sh/), utilize the `"Accept"` content-type header to identify typescript-native js-runtimes, and delived a different variant of the package based on that information.
      this might result in your bundle containing a different code from your expectation, and that could result in inaccuracies
      (for instance, it may serve a deno-compatible ts file, but your bundle is intended to run in the browser).
      so, allowing the user to modify the http-header would let them overcome this issue.
- [ ] add support for parsing `package.json` in the `DenoPackage` class for achieving full jsr-compatibility in the jsr-plugin.
- [ ] add a function to detect the current runtime, so that it can be later used for predicting the base-project-level scope's `runtimePackage: RuntimePackage` (i.e. is it a `package.json(c)` or `deno.json(c)` or `jsr.json(c)`).
  - consider creating a function `fetchScan: (urls: (URL | string)[]) => URL`,
    which will sequentially try fetching the provided `urls` using the `"HEAD"` method, and follow any redirects,
    then return the first (fully-followed) url that results in a valid http response.
  - use the said function for validating the existence of multiple runtime-package json(c) files, sequentially,
    and acquire the first one that exists to use as the url to the `runtimePackage`.
- [ ] ~~in the entry-plugin, consider merging the initial-plugin-data resolver (`initialPluginDataInjector`) into the inherit-plugin-data resolver (`inheritPluginDataInjector`),
      if it provides significant speed boost.
      doing so might undo the 60% slowdown introduced in version `0.3.0` (where inherit-plugin-data was added).~~
  > the reduction in speed was a government propaganda, the cake was a lie, and carbon killed oxide (carbon "die" oxide, get it? haha humor +100, and everyone clapped while congratulating for eternity - [quack quack](https://www.youtube.com/watch?v=oyFQVZ2h0V8&t=11s))

## (2025-04-19) pre-version `0.4.1` todo list

- [x] fix [issue#8](https://github.com/oazmi/esbuild-plugin-deno/issues/8):
      when `stdin` is provided to esbuild, it skips the path resolution step and gets loaded directly by esbuild.
      this means that it doesn't pass through the entry-plugin, and it is not recorded in the internal `importerPluginDataRecord`.
      as a consequence, all of its dependencies will not be able to inherit any plugin-data, and not even the default settings will apply.
  > to fix this issue, we simply observe if `stdin` is present in esbuild's initial options at the beginning,
  > and manually add a record for it in `importerPluginDataRecord` if it is present.

## (2025-04-04) pre-version `0.4.0` todo list

- [x] some websites (like [esm.sh](https://esm.sh/)) that use absolute referencing within their domains via `"/some/abs/path.ts"` fail with the current resolver-pipeline.
  - to solve this, I might have to do one of the following (or both):
    - [ ] ~~introduce a new `pluginData` field that stores the current context's base path (such as base domain url, or base filesystem path),
          and then whenever a path beginning with "/" is encountered, we join it with the base domain path.~~
      > this is simply impractical.
      > instead, I've modified the resolver-pipeline's `RelativePathResolverConfig.resolvePath` to use the url-constructor-like signature `(path?: string, importer?: string) => string`,
      > so that it would inspect if `path` begins with a leading "/" (root-path), and handle it appropriately based on what the `importer` is.
      >
      > this is a breaking change in the signature, so anyone who has written a custom `pathResolve` function will now need to redefine it.
    - [x] modify your `resolveAsUrl` in `@oazmi/kitchensink/pathman` so that it does not return a `file:///` uri whenever an absolute path is encountered with a base-url.
          instead, it should carefully explore which is the more viable possibility.
      > FIXED in [`@oazmi/kitchensink@0.9.10`](https://github.com/omar-azmi/kitchensink_ts/commit/0ab8afefaf998f7d47c288990b63f21183712d70).
      > so simply update to that version.
  - an example to highlight issue:
    ```ts
    const bundle_result = await esbuild.build({
    	entryPoints: ["https://esm.sh/typedoc-plugin-mermaid"],
    	plugins: [...denoPlugins({ autoInstall: false })],
    	format: "esm",
    	bundle: true,
    	write: false,
    })
    ```
    where the entrypoint looks like:
    ```js
    /* esm.sh - typedoc-plugin-mermaid@1.12.0 */
    import "/html-escaper@^3.0.3?target=es2022"
    import "/typedoc@^0.28.0?target=es2022"
    export * from "/typedoc-plugin-mermaid@1.12.0/es2022/typedoc-plugin-mermaid.mjs"
    ```

## (2025-04-02) pre-version `0.3.3` todo list

- [x] implement your own jsonc parser (or jsonc comment-remover) in `@oazmi/kitchensink/stringman`.
  > ADDED in [`@oazmi/kitchensink@0.9.9`](https://github.com/omar-azmi/kitchensink_ts/commit/655666bb4acd8989ce8e4c39e0e0002f31256089).
  > simply update the dependency to resolve this.
- [x] use an alternative smaller library for semver resolution, preferebly from `npm`.
      I really dislike how `jsr:@std/jsonc` and `jsr:@std/semver` collectively add about 450 files to the npm-release (via `dnt`).
  > due to the lack of library options (only `npm:node-semver` and `jsr:@std/semver` implement the `satisfies` function),
  > I ended up implementing my own semver parser and satisfactory-version resolver in kitchensink.
  >
  >> ADDED in [`@oazmi/kitchensink@0.9.11`](https://github.com/omar-azmi/kitchensink_ts/commit/e92525dcb9f9a1a10066f695893e6988e63c9d30).
- [x] import `fileUrlToLocalPath` and `ensureFileUrlIsLocalPath` from [`@oazmi/kitchensink@0.9.10`](https://github.com/omar-azmi/kitchensink_ts/commit/1b768d45d9dfd6152cb0facbacb14c07f54fd4aa),
      and replace the ones inside `/src/plugins/funcdefs.ts`.

## (2025-03-26) pre-version `0.3.2` todo list

> TODO: POSTPONE the package.json based peer-dependencies auto-installation feature for some other release.

- [ ] `npm install` does not install peer-dependencies.
      so if that peer-dependency is **not** a part of your own direct bundled code (i.e. imported within your project's direct scope),
      but the npm-package that you just installed expects it and has an implicit import-dependency on it,
      then the bundling will fail because my plugin will not install the peer-dependency since that peer-dependency will not be prefixed with the `"npm:"` specifier to pass through our `npmPlugin`.
      here are some solution that will partially reduce this issue:
  1. add your known peer-dependencies to the global-import-map of the `resolverPlugin`'s config, ensuring the use of the `"npm:"` specifier in the value portion, and the exact alias string in the key portion.
  2. add a new plugin configuration option for specifying `peerDependencies` that **must** always be installed prior to resolving any `"npm:"` specifier.
  3. use `deno install` with `"nodeModulesDir": "auto"` in "deno.json".
  4. in the installation directory (hopefully your project's root), add a `./.npmrc` text file,
     and inside of it, set `auto-install-peers=true`.
     this will make both `npm` and `pnpm` install any peer-dependencies.
     unfortunately, there is no cli flag for this option, so the creation of this file is our only choice.
     > I just tried this method and it didn't work :/
  5. whenever you install a new npm-package, immediately after its installation, query for its `package.json` file via `build.resolve()`,
     then read through it and collect any peer-dependencies that it may require.
     after that, before proceeding any further, queue those dependencies for installation.
     do note that an alternate path into the package may be accessed meanwhile the peer-dependencies are being installed.
     this will cause them to be unable to resolve the peer-dependency.
     to avoid these race conditions, follow the next optimization checkbox.
     also note that this will only work correctly when either a _clean_ installation is being performed,
     or when we have the perfectly good `"./node_modules/"` artifacts available from an auto-installation.
- [x] when an npm-package is auto-installed (or in the process of being), it is possible for:
  - an alternate entry point to the same package to get successfully resolved (because the file exists),
    but then its own dependency would fail to load, because the file hasn't been added yet.
  - an alternate entry point to the same package discover that the package hasn't been installed (due to failing to resolve),
    and then it will queue up _another_ `npm install` command to the _same_ package that is already underway.

  to stop these two scenarios from happening, we need to make all resolvers that are trying to resolve the same package wait for a central promise to resolve before proceeding.
  to achieve this, we will need to create a `packageAvailability: Map<packageName, Promise<void>>` variable,
  and the first resolver to come across a package that is not contained in `packageAvailability`,
  will insert a new unresolved promise into it, and then let the resource try resolving its path (and auto-installing the package if needed),
  then once the resource's path has been resolved successfully (and any auto-installation has been taken care of),
  we will resolve the promise contained inside `packageAvailability`,
  so that other resources that are waiting for it could be given the green light to then proceed.
- [x] add an option in `npmPlugin`'s config for force installing a list of the user's peer dependencies.
  - name the option `NpmPluginSetupConfig.peerDependencies: ImportMap | (string | {in: string, out: string} | [in: string, out: string])[]`.
  - the installation should initiate in the `build.onStart` call, and the directory of installation (cwd) should be the same as dictated by `autoInstallConfig.cwd`.

## (2025-03-14) pre-version `0.3.1` todo list

- [x] fix critical filesystem vulnerability when performing `autoInstall`!
      suppose your script encounters two "npm:" libraries that need to be auto installed.
      now, two terminal processes will be invoked to perform the installation, and so both terminals may compete over who gets to write first.
      it will be even worse when the _same_ npm-package is being installed simultaneously in multiple terminals.
      God knows what your filesystem would be going through during this moment, when each terminal will be trying to write over the same set of files.
      the solution would be to do one of the following two options:
  - create only a single long-lived terminal, though which all cli-installations commands should go through.
    but then, to change the `cwd` directory, of the terminal, we will have to run the `cd "/abs/path/to/cwd/"` command on it everytime before processing the user's cli-command.
  - create a global queue for executing cli-commands, one by one, each in a new terminal.
    however, there shall be only a single terminal running at a given time.

## (2025-03-13) pre-version `0.3.0` todo list

- [x] optional global import map config at top level of the "all-in-one" plugin config
- [ ] ~~rename old cached fetch to `memCachedFetch`~~
  > will not implement right now (maybe in the future).
- [ ] ~~create a filesystem based cached fetch named `fsCachedFetch`~~
  > will not implement right now (maybe in the future).
- [x] the jsr plugin setup should accept `runtimePackage: DenoPackage | URL | string` configuration option for specifying the current scope/project's `deno.json` file (if there's one).
  > instead of this, in version `0.1.4 (2025-02-22)` I had implemented an "initial plugin-data" plugin that injected the user's current project's `DenoPackage` into `pluginData.runtimePackage`, for all entry-points, and their dependencies.
- [x] in the entry plugin:
  - change the `entryPluginDataInjector` resolver's operation to **only** apply its initial-plugin-data when `args.kind === "entry-points"` and when `args.pluginData === undefined`, and rename the resolver to `initialPluginDataInjector`.
  - add a new resolver (`inheritPluginDataInjector`) between the `initialPluginDataInjector` and the `absolutePathResolver`.
    this new resolver should provide plugin-data-inheritance from the `args.importer` if `args.pluginData === undefined`.
    once it has implicitly called the `absolutePathResolver` and acquired the resolved `result`,
    the function should store `data = result.pluginData` in a global `importerPluginDataRecord = Map<normalized(result.path), data>`,
    so that it its dependencies will be able to inherit the same plugin data of its parent resource,
    if they've been stripped away from their plugin data due to a non-preserving plugin or esbuild's own native loader.
  > while the inherit-plugin-data resolver works wonders and simplifies logic,
  > I saw an increase in bundling time of `https://github.com/goatplatform/todo` when using this plugin as a drop-in replacement for `https://github.com/goatplatform/goatdb`'s internal bundler.
  > previously my plugin took around 10s for bundling, but now it takes 16s.
  > I am only assuming that the newly added plugin-data inhertior resolver might be the culprit.
  > to find out the actual reason, I should attach a debugger to take note of the "hot-spots" causing the slowdown.
  >
  > edit: now it's working faster than before all of a sudden (takes 6.5s now when logs are disabled).
  > I should really benchmark in a more consistent environment.
- [x] ensure that `watch-mode` compatible results are returned by the resolvers and loaders.
  > since everything besides the http files are loaded by esbuild's native loader,
  > the `watchFile`/`watchDir` operations are taken care of by esbuild itself.
  > moreover, I am intentionally leaving out the loaded `file://` uris from being watched (when `HttpPluginSetupConfig.convertFileUriToLocalPath` is not enabled).

## (2025-03-10) pre-version `0.2.2` todo list

- [x] in `npmPlugin`'s `autoInstall` config option:
  - add the ability to set a custom directory in which the installation should take place.
    this custom directory should also be force added (unshift) to the list of `nodeModulesDirs`.
  - add the ability to specify which installation method should be used (auto, dynamic, npm-cli, deno-cli, bun-cli).
    - [x] maybe also add options for invoking `pnpm`, `yarn`, etc...
  - in the function body, we should initially normalize all `nodeModulesDirs` and then pass it through a `Set<string>` so that there are no repeats.
- [x] in `httpPlugin`, add an option to it's config to strip away the `file://` scheme, so that a local path is returned,
      which can be loaded by esbuild natively, instead of fetching it.
  - doing so will resolve an annoyance/bug whereby the node-module resolution fails because the `args.importer` uses a file uri,
    which esbuild cannot use as the value for `resolveDir` since it isn't an absolute local fs path, causing esbuild to fail.
  - another approach could be to convert all `args.importer` that are file uris into local paths before passing it on as the `resolveDir` to the node-package-path validator (`nodeModulesResolverFactory`).
  - [x] both approaches will work (and may be having both would be even better),
        but the first approach will guarantee compatibility with other plugins as well (the ones that only filter local paths, not file-uri),
        instead of just compatibility with esbuild's native resolver.
    > I ended up implementing both techniques for best measures.
    > although, I've made it so that `nodeModulesResolverFactory` itself accepts file-uris for all or its `args`,
    > instead of making everything else ensure that the file-uris are converted into local paths.
- [x] abstract away logging from a direct `console.log` a logger function call.
  - I need this because the log often exceeds the terminal's history/screen for huge projects,
    making it impossible to trace back where a resolution error may have originated from.
  - moreover, instead of performing direct consecutive logs, we should make only a single log,
    because even though javascript is singler threaded, and the consecutive logs should theoretically occur in succession,
    that ends up not happening (perhapse because the log function is asynchronous?),
    and successive synchronous logs are often jumbled up.
    also, I think esbuild's own stderr logs originate from the go-binary, not the javascript wrapper code,
    causing abrupt intermediate interference with my logs, messing up the formatting and color.
- [x] migrate all utility functions to `/src/plugins/funcdefs.ts`, and migrate the `DIRECTORY` enum to `/src/plugins/typedefs.ts`.
- [x] fix [issue#4](https://github.com/oazmi/esbuild-plugin-deno/issues/4):
      in the `jsrPackageToMetadataUrl` helper function of the `DenoPackage` class's module,
      I forgot to include the "jsonc" variants of the package json files in the list of urls that I attempt fetch.

## (2025-03-07) pre-version `0.2.1` todo list

- [x] in either the `jsrPlugin` or a new `npmPlugin`, we should install npm packages via deno, by tricking it into importing the package and storing it into local `node_modules` folder (which WILL require `"nodeModulesDir": "auto"` in the top-level package's `deno.json`) in the following way:
  ```ts
  const dynamic_export_script = `export * as myLib from "npm:@${pkg.scope}/${pkg.name}@${pkg.version}"`
  const dynamic_export_script_blob = new Blob([dynamic_export_script], { type: "text/javascript" })
  const dynamic_export_script_url = URL.createObjectURL(dynamic_export_script_blob)
  const phony_importer = await import(dynamic_export_script_url)
  ```
  on the other hand, if the `npm` command is available on the host system, then we can also execute `npm install pkg-name --no-save` (via `import { exec } from "node:child_process"; await exec("...")`) if it is not already present in `package.json`, or just `npm install pkg-name` if it is present in `package.json`.

## (2025-03-05) pre-version `0.2.0` todo list

- [x] revamp the plugin architecture:
  - overview: there should be two categories of plugins, and the communication between the two categories will primarily occur through referring to their `namespace` when making calls to `build.resolve` within the `build.onResolve`'s callback function.
  - [x] the first category of plugins will be the _filter_ plugins.
    - these plugins will capture input entities from the default namespace through the use of filters (such as "jsr:", "https?://", "npm:", etc...).
    - if applicable, the plugin will inject the appropriate `pluginData` into the entity's `args`.
    - now, to resolve the path, the filter plugin will call `build.resolve` with the `namespace` set to the entry-namespace of the _resolver plugins_ (the second new category), so that it passes through a pipeline of modularized `pluginData` resolvers.
      for the time being, let's assume that the resolver plugins' pipeline's entry namespace is called `"oazmi-resolver-pipeline"`.
    - if the pipeline of resolvers do return a successful result, we'll return that result after changing the namespace back to the default one, or a different one that is required by some specific loader (such as the url-fetcher-loader).
    - if the pipeline was unsuccessful, we'll do one of the following:
      - if the `args.path` being loaded is not something ambiguous, such as beginning with "jsr:", "http://", or "npm:" specifiers, then maybe all it needs is some kind of conversion. for instance:
        - "jsr:{package_name}" -> "https://jsr.io/{package_name}" (but honestly, this would be taken care of by the `runtimePackage` resolver plugin when we pass the correct `pluginData` to it, so why would it remain unresolved?)
        - or "npm:{package_name}" -> "{package_name}" (this conversion can be taken care of in a namespaced-environment if I implement the `node_modules` resolver plugin in my bucket list).
      - if the path is ambiguous (for instance, is `args.path = "react.css"` referring to the importer's `"./react.css"`, or the `"{resolveDir}/node_modules/react.css/"` npm package?), then try resolving it with esbuild's native path resolver, otherwise join the path with the importer's path.
      - if for some reason, neither of the two cases above apply, we should return `undefined` to let some other plugin take care of this entity.
  - [x] the second category of plugins will be the _resolver_ plugins.
    - these plugins will only exist in a specific namespace (let's say `"oazmi-resolver-pipeline"`), and their filter will be usually set to "capture all" (i.e. `RegExp(".*")`).
    - essentially, it will be a collection of three/four resolvers:
      - the first will take care of resolving with respect to `pluginData.importMap`.
      - the second will take care of resolving with respect to `pluginData.runtimePackage`.
      - (optional) the third will take care of resolving with respect to `node_modules`, by utilizing esbuild's native resolver via a new `build.esbuild.build` process described in the bucket list.
        (or perhaps, I should create a new `NpmPackage: RuntimePackage` that internally calls `esbuild.build` when its `resolveImport` method is called?)
      - the fourth resolver will simply join the `args.path` with the `args.importer` path, so long as `args.path` is not absolute.

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
