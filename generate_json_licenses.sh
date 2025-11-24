#!/bin/bash
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
#   Gianfranco Cedro
# Script to generate LICENSE.txt files for JSON files in the repository

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directories to process
DIRECTORIES=("backend" "decidim" "frontend" ".")

# Function to get git authors for a file
get_git_authors() {
    local file="$1"
    
    # Get all unique authors for this file using git log (limited to last 50 commits for performance)
    local authors=$(git log -n 50 --format='%an' -- "$file" 2>/dev/null | sort -u)
    
    if [ -z "$authors" ]; then
        # No git history, use current user
        echo "//   # $(git config user.name 2>/dev/null || echo 'Unknown')"
    else
        echo "$authors" | sed 's/^/\/\/   # /'
    fi
}

# Function to generate license file
generate_license() {
    local json_file="$1"
    local license_file="${json_file}.LICENSE.txt"
    
    echo -e "${YELLOW}Processing: ${json_file}${NC}"
    
    # Get authors
    local authors=$(get_git_authors "$json_file")
    
    # If no authors found (file not committed yet), use current git user
    if [ -z "$authors" ]; then
        local current_user=$(git config user.name)
        authors="//   # ${current_user}"
        echo -e "${YELLOW}  Warning: No git history found, using current user: ${current_user}${NC}"
    fi
    
    # Generate license file using echo to avoid here-doc issues
    {
        echo "// SPDX-License-Identifier: AGPL-3.0"
        echo "// Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0"
        echo "// Authors:"
        echo "$authors"
    } > "$license_file"
    
    echo -e "${GREEN}  Created: ${license_file}${NC}"
}

# Main processing
echo "=========================================="
echo "JSON License File Generator"
echo "=========================================="
echo ""

total_files=0

# Get all JSON files tracked by git, excluding node_modules and package-lock files
all_json_files=$(git ls-files "*.json" "*/*.json" "*/*/*.json" "*/*/*/*.json" "*/*/*/*/*.json" "*/*/*/*/*/*.json" 2>/dev/null | \
    grep -v "node_modules" | \
    grep -v "package-lock\.json" | \
    grep -v "yarn\.lock" | \
    grep -v "composer\.lock" | \
    grep -v "coverage/" | \
    grep -v "build/" | \
    grep -v "dist/" | \
    grep -v ".next/" | \
    grep -v ".cache/" | \
    grep -v "test-results/" || true)

if [ -z "$all_json_files" ]; then
    echo "No JSON files found to process"
    exit 0
fi

echo "Found JSON files to process:"
echo "$all_json_files" | sed 's/^/  - /'
echo ""

# Convert to array for safe iteration
mapfile -t json_files_array <<< "$all_json_files"

# Process each file
for json_file in "${json_files_array[@]}"; do
    # Skip empty lines
    [ -z "$json_file" ] && continue
    
    # Skip if file doesn't exist
    [ ! -f "$json_file" ] && continue
    
    # Only process files in specified directories
    should_process=false
    for dir in "${DIRECTORIES[@]}"; do
        if [ "$dir" = "." ]; then
            # Check if file is in root (no slashes) or in allowed subdirs
            if [[ "$json_file" != *"/"* ]] || [[ "$json_file" =~ ^(backend|decidim|frontend|analytics|tests)/ ]]; then
                should_process=true
                break
            fi
        elif [[ "$json_file" == "$dir/"* ]]; then
            should_process=true
            break
        fi
    done
    
    if [ "$should_process" = false ]; then
        continue
    fi
    
    generate_license "$json_file"
    ((total_files++))
done

echo "=========================================="
echo -e "${GREEN}Done! Processed ${total_files} JSON files${NC}"
echo "=========================================="
echo ""
echo "Note: You may want to add *.LICENSE.txt to your .gitignore if these files should not be committed."
