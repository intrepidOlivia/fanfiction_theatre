#!/bin/bash
# This script iterates through all images in public/assets/gallery and writes gallery_config to reflect the current set of images.
# Note that the jq library must be installed to run this script.

CONFIG_FILE="./public/gallery_config.json"
SERVE_LOCATION="public/"
IMAGE_DIR="public/assets/gallery"

# Ensure the config file exists
if [ ! -f "$CONFIG_FILE" ] || [ ! -s "$CONFIG_FILE" ]; then
    echo "[]" > "$CONFIG_FILE"
fi

# Retrieve file modified time based on which OS you're using
get_mtime() {
    local file="$1" # $1 is the first argument sent to the function

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # MacOS syntax
        stat -f "%m" "$file"
    else
        # Linux syntax 
        stat -c "%Y" "$file"
    fi 
    # Why are the Mac and Linux syntaxes so similar but different? Fuck you, that's why
    # Windows users must use a Linux shell, sorry
}

# This function outputs a JSON object string for every file in the IMAGE_DIR directory
generate_json_stream() {
    find "$IMAGE_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) ! -name "*_thumbnail.jpg" | while read -r img; do
        # Get timestamp
        time=$(get_mtime "$img")

        # Get paths
        ext="${img##*.}"
        base="${img%.*}"
        thumb_path="${base}_thumbnail.jpg"

        # Check if thumbnail exists; if not, use the high res path
        if [ ! -f "$thumb_path" ]; then
            thumb_path="$img"
        fi

        # Strip the serve location
        final_src="${img#$SERVE_LOCATION}"
        final_thumb="${thumb_path#$SERVE_LOCATION}"

        # Output the JSON object
        printf '{"src":"%s","thumb":"%s","title":"","desc":"","mtime":%s}\n' "$final_src" "$final_thumb" "$time"
    done
}

# JQ Documentation: https://jqlang.org/manual/
# Calls the generate_json_stream function and pipes it into jq
# Also retrieves the previous title and description and perpetuates them.
generate_json_stream | jq -s \
    --argjson existing "$(cat "$CONFIG_FILE")" '
    ($existing | INDEX(.src)) as $old_data |
    map(
        .src as $current_src |
        . + {
            "title": ($old_data[$current_src].title // ""),
            "desc": ($old_data[$current_src].desc // "")
        }
    )
    | sort_by(.mtime)
    | reverse
    | map(del(.mtime))    

    ' > "${CONFIG_FILE}.tmp" && mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"


echo "Gallery configuration updated in $CONFIG_FILE"