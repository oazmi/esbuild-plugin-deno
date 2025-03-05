/** a central enum containing the list of esbuild namespaces used by the plugins in this library. */
export var PLUGIN_NAMESPACE;
(function (PLUGIN_NAMESPACE) {
    PLUGIN_NAMESPACE["RESOLVER_PIPELINE"] = "oazmi-resolver-pipeline";
    PLUGIN_NAMESPACE["LOADER_HTTP"] = "oazmi-loader-http";
})(PLUGIN_NAMESPACE || (PLUGIN_NAMESPACE = {}));
/** a list of default namespaces that esbuild uses for native/entry-point resolution. */
export const defaultEsbuildNamespaces = [undefined, "", "file"];
/** a list of all esbuild content type loaders. */
export const allEsbuildLoaders = [
    "base64", "binary", "copy", "css", "dataurl",
    "default", "empty", "file", "js", "json",
    "jsx", "local-css", "text", "ts", "tsx",
];
