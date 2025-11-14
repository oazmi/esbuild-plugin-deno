/** no external library dependencies. as it should be. */

/** flags used for minifying (or eliminating) debugging logs and asserts, when an intelligent bundler, such as `esbuild`, is used. */
export const enum DEBUG {
	LOG = 0,
	ASSERT = 0,
	ERROR = 1,
	PRODUCTION = 1,
	MINIFY = 1,
}
