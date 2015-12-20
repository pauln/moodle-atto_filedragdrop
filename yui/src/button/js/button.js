// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/*
 * @package    editor-atto
 * @copyright  2015 Paul Nicholls
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * @module moodle-atto_filedragdrop
 */

/**
 * Atto text editor filedragdrop plugin.
 *
 * This plugin adds the ability to drop a file in and have it auto-upload
 * into the relevant Moodle draft file area.
 *
 * @namespace M.atto_filedragdrop
 * @class Button
 * @extends M.editor_atto.EditorPlugin
 */
var COMPONENTNAME = 'atto_filedragdrop',
    // @codingStandardsIgnoreStart
    LINKTEMPLATE = '' +
            '<a href="{{url}}" ' +
                '{{#if id}}id="{{id}}" {{/if}}' +
                '>{{text}}',
    IMAGETEMPLATE = '' +
            '<img src="{{url}}" ' +
                '{{#if alt}}alt="{{alt}}" {{/if}}' +
                ' style="vertical-align:text-bottom;margin: 0 .5em;" class="img-responsive" ' +
                '{{#if presentation}}role="presentation" {{/if}}' +
                '{{#if id}}id="{{id}}" {{/if}}' +
                '/>';
    // @codingStandardsIgnoreEnd

Y.namespace('M.atto_filedragdrop').Button = Y.Base.create('button', Y.M.editor_atto.EditorPlugin, [], {
    /**
     * A reference to the current selection at the time that the dialogue
     * was opened.
     *
     * @property _currentSelection
     * @type Range
     * @private
     */
    _currentSelection: null,

    /**
     * Add event listeners.
     *
     * @method initializer
     */
    initializer : function() {
        this.editor.on('drop', this._handleDragDrop, this);
    },

    _handleDragDrop : function(e) {
        var self = this,
            host = this.get('host'),
            template = Y.Handlebars.compile(LINKTEMPLATE),
            imgtemplate = Y.Handlebars.compile(IMAGETEMPLATE);
        host.saveSelection();
        e = e._event;
        // Only handle the event if an image file was dropped in.
        var handlesDataTransfer = (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length);
        // @codingStandardsIgnoreLine
        if (handlesDataTransfer && !/^image\//.test(e.dataTransfer.files[0].type)) {
            var options = host.get('filepickeroptions').link,
                savepath = (options.savepath === undefined) ? '/' : options.savepath,
                formData = new FormData(),
                timestamp = 0,
                uploadid = "",
                xhr = new XMLHttpRequest(),
                imagehtml = "",
                keys = Object.keys(options.repositories);

            e.preventDefault();
            e.stopPropagation();
            formData.append('repo_upload_file', e.dataTransfer.files[0]);
            formData.append('itemid', options.itemid);

            for (var i = 0; i < keys.length; i++) {
                if (options.repositories[keys[i]].type === 'upload') {
                    formData.append('repo_id', options.repositories[keys[i]].id);
                    break;
                }
            }
            formData.append('env', options.env);
            formData.append('sesskey', M.cfg.sesskey);
            formData.append('client_id', options.client_id);
            formData.append('savepath', savepath);
            formData.append('ctx_id', options.context.id);

            // Insert spinner as a placeholder.
            timestamp = new Date().getTime();
            uploadid = 'moodlefile_' + Math.round(Math.random() * 100000) + '-' + timestamp;
            host.focus();
            host.restoreSelection();
            imagehtml = imgtemplate({
                url: M.util.image_url("i/loading_small", 'moodle'),
                alt: M.util.get_string('uploading', COMPONENTNAME),
                id: uploadid
            });
            host.insertContentAtFocusPoint(imagehtml);
            self.markUpdated();

            xhr.onreadystatechange = function() {
                var placeholder = self.editor.one('#' + uploadid),
                    result,
                    file,
                    newhtml,
                    newtag;

                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        result = JSON.parse(xhr.responseText);
                        if (result) {
                            if (result.error) {
                                if (placeholder) {
                                    placeholder.remove(true);
                                }
                                return new M.core.ajaxException(result);
                            }

                            file = result;
                            if (result.event && result.event === 'fileexists') {
                                // A file with this name is already in use here - rename to avoid conflict.
                                // Chances are, it's a different file (stored in a different folder on the user's computer).
                                // If the user wants to reuse an existing file, they can copy/paste the link within the editor.
                                file = result.newfile;
                            }

                            // Replace placeholder with actual link.
                            newhtml = template({
                                url: file.url,
                                text: file.file || file.filename
                            });
                            newtag = Y.Node.create(newhtml);
                            if (placeholder) {
                                placeholder.replace(newtag);
                            } else {
                                self.editor.appendChild(newtag);
                            }
                            self.markUpdated();
                        }
                    } else {
                        Y.use('moodle-core-notification-alert', function() {
                            new M.core.alert({message: M.util.get_string('servererror', 'moodle')});
                        });
                        if (placeholder) {
                            placeholder.remove(true);
                        }
                    }
                }
            };
            xhr.open("POST", M.cfg.wwwroot + '/repository/repository_ajax.php?action=upload', true);
            xhr.send(formData);
            return false;
        }
    }

});
