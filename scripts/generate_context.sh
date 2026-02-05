#!/bin/bash

OUTPUT_FILE="BLUE_CINIS_FULL_CODEBASE.txt"
rm -f "$OUTPUT_FILE"
touch "$OUTPUT_FILE"

echo "Generating $OUTPUT_FILE..."

# Function to append file content
append_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "=== $file ===" >> "$OUTPUT_FILE"
        cat "$file" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    fi
}

# Root configuration files
append_file "package.json"
append_file "next.config.ts"
append_file "tailwind.config.js"
append_file "tsconfig.json"
append_file "middleware.ts"
append_file "playwright.config.ts"
append_file "vitest.config.mts"
append_file "prisma/schema.prisma"
append_file "README.md"
append_file "DEPLOY.md"
append_file "NOTEBOOKLM_PROMPTS.md"

# Directories to traverse recursively
# Using fin to locate files and loop through them
# Adjust exclusions as needed
find app components context lib src stories styles types scripts \
    -type f \
    \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.mjs" -o -name "*.css" -o -name "*.md" -o -name "*.json" \) \
    -not -name "package-lock.json" \
    -not -path "*/node_modules/*" \
    -not -path "*/.next/*" \
    -not -path "*/test-results/*" \
    -not -path "*/playwright-report/*" \
    -not -path "*/.git/*" \
    | sort | while read -r file; do
    append_file "$file"
done

echo "Done. File created at $(pwd)/$OUTPUT_FILE"
wc -l "$OUTPUT_FILE"
