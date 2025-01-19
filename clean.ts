/** clean this project's temporary directories and files. */

const
	shell_args = new Set(Deno.args),
	dryrun = shell_args.delete("--dryrun"),
	dirs_only = shell_args.delete("--dirs-only"),
	files_only = shell_args.delete("--files-only"),
	shell_rest_args = [...shell_args]

const delete_dir_list: string[] = [
	"./docs/",
	"./dist/",
	"./npm/",
	"./node_modules/",
	"./temp/",
	/*
	"./backup/",
	*/
]

const delete_file_list: string[] = [
	"./deno.d.ts",
	"./package.json",
	"./tsconfig.json",
	"./typedoc.json",
	/*
	"deno.lock",
	*/
]

if (dirs_only || !files_only) {
	await Promise.all(delete_dir_list.map(async (dir_path) => {
		try {
			const stat = await Deno.stat(dir_path)
			if (stat.isDirectory) {
				console.log("[in-fs] deleting directory:", dir_path)
				if (!dryrun) { await Deno.remove(dir_path, { recursive: true }) }
			}
		} catch (error) { console.warn("directory does not exist:", dir_path) }
	}))
}

if (files_only || !dirs_only) {
	await Promise.all(delete_file_list.map(async (file_path) => {
		try {
			const stat = await Deno.stat(file_path)
			if (stat.isFile) {
				console.log("[in-fs] deleting file:", file_path)
				if (!dryrun) { await Deno.remove(file_path) }
			}
		} catch (error) { console.warn("file does not exist:", file_path) }
	}))
}
