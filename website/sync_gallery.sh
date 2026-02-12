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

# This function outputs a JSON object string for every file in the IMAGE_DIR directory
generate_json_stream() {
    find "$IMAGE_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) ! -name "*_thumbnail.jpg" | while read -r img; do

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
        printf '{"src":"%s","thumb":"%s","title":"","desc":""}\n' "$final_src" "$final_thumb"
    done
}

# Call the function and pipe it into jq
# The -s (slurp) option concats the objects into an array.
generate_json_stream | jq -s '.' > "$CONFIG_FILE"

echo "Gallery configuration updated in $CONFIG_FILE"