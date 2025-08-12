## test 2

in this test, we validate the plugin's support for workspace package import and export resolution.

workspace packages work in the following way:

- ### rules:
  - every package can import its own _exports_ (i.e. self-reference).
  - every package has its child-package's _exports_ available to it as an export.
  - every package has its parent-package's _imports_ available to it as an import.

- ### implications:
  the following rules can be implied from the three rules above:
  - a package can import its from its sibling package's _exports_ (indirectly through the parent package).
  - the root package's imports are available to all child, grandchild, and descendant packages.

- ### example:
  - assume that `W` is the root package, and that it consists of two child packages `X` and `Y`.
  - and then assume that `Z` is a child package of `Y`.
    ```mermaid
    ---
    config:
      layout: elk
    ---

    flowchart TB
    	W --> X & Y
    	Y --> Z
    ```
  - this would result in the following relations:
    - $W_{exports} = X_{exports} \cup Y_{exports} \equiv X_{exports} \cup Y_{exports} \cup Z_{exports}$
    - $W_{imports} = W_{exports} \cup W_{external\_imports} \equiv X_{exports} \cup Y_{exports} \cup Z_{exports} \cup W_{external\_imports}$
    - $X_{exports} = X_{own\_exports} \cup Z_{exports}$
    - $X_{imports} = X_{external\_imports} \cup X_{exports} \cup W_{imports}$
    - $Y_{exports} = Y_{own\_exports}$
    - etc...

## the test

```mermaid
---
title: test project structure
config:
  layout: elk
---

flowchart TB
	subgraph dir1["<code>_root/_</code><br>(root of workspace)"]
		file1["<code>_./deno.json_</code>"]
	end
	file1 -- "workspace<br>member" --> dir2 & dir3 & dir4
	file2 -- "workspace<br>member" --> dir5
	linkStyle 0,1,2,3 stroke:#AA0000

	hex1@{ shape: "hexagon", label: "<code>jsr:#1 as @external/1</code>" }
	hex2@{ shape: "hexagon", label: "<code>http:#2 as @external/2</code>" }
	hex3@{ shape: "hexagon", label: "<code>npm:#3 as @external/3</code>" }
	hex4@{ shape: "hexagon", label: "<code>@external/1</code>" }
	hex5@{ shape: "hexagon", label: "<code>@external/2</code>" }
	hex6@{ shape: "hexagon", label: "<code>@external/1</code>" }
	hex1 & hex2 -. "imports" .-> file1
	hex3 -.-> file4
	file1 -.-> hex5 -. "imports" .-> file4
	file1 -.-> hex4 -. "imports" .-> file2
	file2 -.-> hex6 -. "imports" .-> file5
	linkStyle 4,5,6 stroke:#0000FF
	linkStyle 7,8,9,10,11,12 stroke:#00AA00

	subgraph group1[" "]
		direction LR
		style group1 fill:#00000000,stroke:none

		subgraph dir2["<code>_root/a1/proj-a/_</code>"]
			file2["<code>_./deno.jsonc_<br>name: **projA**</code>"]
		end

		subgraph dir3["<code>_root/b1/b2/proj-b/_</code><br>(the bundling target)"]
			style dir3 fill:#FF9944
			file3["<code>_./jsr.jsonc_<br>name: **projB**</code>"]
		end

		subgraph dir4["<code>_root/c1/c2/c3/proj-c/_</code>"]
			file4["<code>_./deno.json_<br>name: **projC**</code>"]
		end

		subgraph dir5["<code>_root/d1/proj-d/_</code>"]
			file5["<code>_./jsr.json_<br>name: **projD**</code>"]
		end

		file5 -. "imports from<br>**projD**" .-> file2
		file2 -. "imports from<br>**projA**" .-> file3
		file4 -. "imports from<br>**jsr:projC**" .-> file3
		linkStyle 13,14,15 stroke:#00AA00
	end
```
