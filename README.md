# ckeditor-plugin

## Development server

Run:

1. `docker build -t ckeditor_plugin_img .`
1. `npm install`
1. `npm run dev`
1. `docker run -it -v ${PWD}/demo:/usr/share/nginx/html:ro -p 8888:80 --rm ckeditor_plugin_img`
