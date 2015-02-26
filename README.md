[![Build Status](https://travis-ci.org/vampiricwulf/tanoshiine.svg?branch=master)](https://travis-ci.org/vampiricwulf/tanoshiine)

Real-time imageboard.
MIT licensed.


Note: The git master branch contains the development version of the board. For more stable revisions, please download the latest release.

##Setup

* Install dependencies listed below
* Sign up for reCAPTCHA
* Run `npm install` to install npm deps and compile C++ addons
* Configure config.js, hot.js, imager/config.js and report/config.js
* Run `node builder.js` to run an auto-reloading development server
* Alternatively, you can run `curl -Ls https://raw.githubusercontent.com/bakape/doushio/master/DEPLOY.sh | bash -`
	as root for a basic semiautomatic production setup. Currently Ubuntu-only

##Production

* Have your webserver serve www/ (or wherever you've moved src, thumb, etc.)
* Run `node server/server.js` for just the server
* config.DAEMON support is broken for now
* You can update client code & hot.js on-the-fly with `node server/kill.js`

##Dependencies

* ImageMagick
* gcc, g++, make
* libpng with development headers
* [io.js](https://iojs.org)
* redis

###Optional dependencies for various features

* ffmpeg 2.2+ for WebM support
* pngquant  2.3.1+ for PNG thumbnails
* exiftool for stripping images of EXIF data

###Optional npm dependancies
* ~~daemon~~ (broken currently)
* icecast now-playing banners: node-expat
* [send](https://github.com/visionmedia/send) (if you want to serve static files directly from the node.js process; useful in debug mode also)
* suggestion box: github

## Documentation

* docs/api.md - JSON API documentation
* docs/doushio.initscript.example - example init script
* docs/filemap.md - project file map
* docs/nginx.config.example - example ngingx reverse proxy configuration file

##Standalone upkeep scripts

* archive/daemon.js - moves old threads to the archive
* upkeep/backup.js - uploads rdb to S3
* upkeep/backup.sh - MEGA backup script
* upkeep/clean.js - deletes archived images
* upkeep/purge_bans.sh - Removes all bans
* upkeep/purge_mod_sessions.sh - Closes all active moderator sessions
* upkeep/radio.js - icecast2 server integration
