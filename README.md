# html-inliner

A simple little tool to inline the stylesheets, scripts and images referenced by link as embedded styles, base64 images
and embedded scripts respectively.

This is useful for cases where you want to publish a page via some platform which limits access to external resources.

# Usage

## Command line

    html-inliner [options] <input-directory>

    Options:
      --no-inline-js        Don't inline scripts
      --no-inline-styles    Don't inline stylesheets

## Node.js
    
    const htmlInliner = require('@mherod/html-inliner');
    htmlInliner.transformAll("./dist/")
