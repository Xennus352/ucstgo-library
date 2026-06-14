#!/bin/bash

mkdir -p recovered_output
tmp_hashes="hashes.txt"
> "$tmp_hashes"

git fsck --lost-found 2>/dev/null | awk '/dangling blob/ {print $3}' | while read blob; do
    content=$(git cat-file -p "$blob")

    # hash content to detect duplicates
    hash=$(echo "$content" | sha256sum | awk '{print $1}')

    # skip if already seen
    if grep -q "$hash" "$tmp_hashes"; then
        continue
    fi

    echo "$hash" >> "$tmp_hashes"

    # try to detect file type
    filename="recovered_output/file_${blob}.txt"

    echo "$content" > "$filename"

    echo "Recovered: $filename"
done

echo "Done. Unique files saved in recovered_output/"