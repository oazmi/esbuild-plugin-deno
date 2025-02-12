export { Deno } from "@deno/shim-deno";
export declare const dntGlobalThis: Omit<typeof globalThis, "Deno"> & {
    Deno: any;
};
//# sourceMappingURL=_dnt.shims.d.ts.map