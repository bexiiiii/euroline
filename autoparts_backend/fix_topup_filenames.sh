#!/bin/bash

# Script to fix topup receipt filenames by removing spaces and special characters
TOPUP_DIR="/Users/behruztohtamishov/euroline/autoparts_backend/storage/receipts/topups"

echo "Fixing topup receipt filenames in: $TOPUP_DIR"

# Create directory if it doesn't exist
mkdir -p "$TOPUP_DIR"
cd "$TOPUP_DIR" || exit 1

echo "Current files before fixing:"
ls -la

# Find all topup files and rename them
for file in topup_*; do
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

echo "Topup filename fixing completed."
echo "Current files after fixing:"
ls -la