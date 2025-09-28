#!/bin/bash

# Script to fix banner filenames by removing spaces and special characters
BANNER_DIR="/Users/behruztohtamishov/euroline/autoparts_backend/storage/images/banners"

echo "Fixing banner filenames in: $BANNER_DIR"

cd "$BANNER_DIR" || exit 1

# Find all banner files and rename them
for file in banner_*; do
    if [ -f "$file" ]; then
        # Replace spaces and special characters with underscores
        new_name=$(echo "$file" | sed 's/[^a-zA-Z0-9._-]/_/g' | sed 's/_\+/_/g')
        
        if [ "$file" != "$new_name" ]; then
            echo "Renaming: '$file' -> '$new_name'"
            mv "$file" "$new_name"
        else
            echo "No change needed: '$file'"
        fi
    fi
done

echo "Banner filename fixing completed."
echo "Current files:"
ls -la