# html-inliner

A simple little tool to inline the stylesheets, scripts and images referenced by link as embedded styles, base64 images
and embedded scripts respectively.

This is useful for cases where you want to publish a page via some platform which limits access to external resources.

For example, the following HTML:

    <html>
      <head>
        <link rel="stylesheet" href="http://example.com/style.css">
      </head>
      <body>
        <img src="http://example.com/image.png">
        <script src="http://example.com/script.js"></script>
      </body>
    </html>

Would be transformed into:

    <html>
      <head>
        <style type="text/css">
          /* contents of http://example.com/style.css */
        </style>
      </head>
      <body>
        <script>
            /* contents of http://example.com/script.js */
        </script>
      </body>
    </html>

# Usage

## Command line

    html-inliner [options] <input-directory>

    Options:
      --no-inline-js        Don't inline scripts
      --no-inline-styles    Don't inline stylesheets

## Node.js

    const htmlInliner = require('@mherod/html-inliner');
    htmlInliner.transformAll("./dist/")
