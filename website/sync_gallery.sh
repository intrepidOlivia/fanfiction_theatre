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

# Temporary JSON builder file
TEMP_JSON=$(mktemp)
echo "[]" > "$TEMP_JSON"

# Loop through all the files that are not thumbnails
find "$IMAGE_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) ! -name "*_thumbnail.jpg" | while read -r img; do

    # Get path of thumbnail
    ext="${img##*.}"
    base="${img%.*}"
    thumb_path="${base}_thumbnail.${ext}"

    # Check if thumbnail exists; if not, use the high res path
    if [ ! -f "$thumb_path" ]; then
        thumb_path="$img"
    fi

    # Use jq to append the new object to our temporary JSON list
    # See jq documentation: https://jqlang.org/manual/#:~:text=on%20modules%20below.-,%2D%2Darg,-name%20value%3A
    jq --arg src "${img#$SERVE_LOCATION}" \
        --arg thumb "${thumb_path#$SERVE_LOCATION}" \
        '. += [{ "src": $src, "thumb": $thumb, "title": "", "desc": "" }]' \
        "$TEMP_JSON" > "${TEMP_JSON}.tmp" && mv "${TEMP_JSON}.tmp" "$TEMP_JSON"

done

# Overwrite the original config with the new generated list
mv "$TEMP_JSON" "$CONFIG_FILE"

echo "Gallery configuration updated in $CONFIG_FILE"