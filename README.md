File Drag & Drop plugin for Moodle's Atto editor
================================================

[![Build Status](https://travis-ci.org/pauln/moodle-atto_filedragdrop.svg?branch=master)](https://travis-ci.org/pauln/moodle-atto_filedragdrop)

An Atto plugin which adds drag and drop support for files which aren't images.


Description
===========

This plugin for Moodle's Atto WYSIWYG editor lets you drag any file into Atto - from documents to videos - in order to upload them into Moodle and add a link to the file within the Atto content.

If you are using Moodle's media filters, any supported multimedia files will display inline via the filter once published.


Installation
============

1. Make sure you're running Moodle 2.7 or later
2. Download and unpack the module, renaming the folder to "filedragdrop" if necessary
3. Place the "filedragdrop" folder in the "lib/editor/atto/plugins" subdirectory of your Moodle installation
4. Visit http://yoursite.com/admin to finish installation of the plugin
5. Go to your Site administration ► Plugins ► Text editors ► Atto HTML editor ► Atto toolbar settings
6. Add "filedragdrop" somewhere in the toolbar configuration

#### NOTE:
If you're running Moodle 2.9.2 or earlier, you'll need to make sure to include "filedragdrop" *before* the standard "image" plugin in your Atto toolbar configuration, due to a bug which resulted in the image plugin handling but ignoring non-image files.  This bug was fixed in Moodle 2.9.3 and 3.0.
