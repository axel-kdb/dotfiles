#!/bin/bash

CSS="gtk.css"
BAK="gtk.css.bak"
TMP="gtk.css.tmp"

# Check both files exist
if [[ ! -f "$CSS" && ! -f "$BAK" ]]; then
    echo "Neither $CSS nor $BAK exist."
    exit 1
fi
# Swap safely
if [[ -f "$CSS" && -f "$BAK" ]]; then
    mv "$CSS" "$TMP" && mv "$BAK" "$CSS" && mv "$TMP" "$BAK"
    echo "Swapped $CSS and $BAK."
fi

