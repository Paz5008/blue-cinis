
import os

ARTIFACT_PATH = "/Users/julesfrancois/.gemini/antigravity/brain/76e4502f-1544-43c0-ab16-4aee44c5c5e0/homepage_complete_code.md"

DIRECTORIES_TO_SCAN = [
    "components/home",
    "components/canvas",
    "components/ui"
]

SPECIFIC_FILES = [
    "app/page.tsx",
    "app/layout.tsx",
    "app/globals.css",
    "src/lib/store.ts",
    "src/lib/data/artworks.ts",  # Correct paths based on previous ls check
    "lib/data/artworks.ts",      # Try both just in case, only valid will be added
    "src/lib/data/artists.ts",
    "lib/data/artists.ts"
]

def generate_doc():
    files_to_process = []
    processed_paths = set()

    # 1. Collect Specific Files
    for fpath in SPECIFIC_FILES:
        if os.path.exists(fpath) and fpath not in processed_paths:
            files_to_process.append(fpath)
            processed_paths.add(fpath)

    # 2. Collect Directory Files
    for directory in DIRECTORIES_TO_SCAN:
        if os.path.exists(directory):
            for root, dirs, files in os.walk(directory):
                for file in sorted(files): # Sort for consistency
                    if file.endswith(".tsx") or file.endswith(".ts") or file.endswith(".css"):
                        full_path = os.path.join(root, file)
                        if full_path not in processed_paths:
                            files_to_process.append(full_path)
                            processed_paths.add(full_path)

    with open(ARTIFACT_PATH, "w") as out:
        out.write("# Homepage Complete Code Documentation\n\n")
        out.write("Exhaustive compilation of source code.\n\n")
        
        # Write Table of Contents
        out.write("## Table of Contents\n\n")
        for fpath in files_to_process:
            # Create a markdown link anchor
            anchor = fpath.replace("/", "").replace(".", "").replace(" ", "-").lower()
            out.write(f"- [{fpath}](#{anchor})\n")
        
        out.write("\n---\n\n")

        # Write Content
        for fpath in files_to_process:
             # Create matching anchor (manual implementation as Github/Markdown renderers vary, but header is usually enough)
             # We just use the file path as the header
            anchor = fpath.replace("/", "").replace(".", "").replace(" ", "-").lower()
            out.write(f"\n### <a name=\"{anchor}\"></a>{fpath}\n")
            
            ext = fpath.split('.')[-1]
            lang = "tsx" if ext in ["tsx", "ts"] else ext
            out.write(f"```{lang}\n")
            try:
                with open(fpath, "r") as f:
                    out.write(f.read())
            except Exception as e:
                out.write(f"// Error reading file: {e}")
            out.write("\n```\n")
            print(f"Added {fpath}")

if __name__ == "__main__":
    generate_doc()
