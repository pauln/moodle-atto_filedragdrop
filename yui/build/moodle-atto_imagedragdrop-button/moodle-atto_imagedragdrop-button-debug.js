YUI.add('moodle-atto_imagedragdrop-button', function (Y, NAME) {

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

/**
 * Atto text editor imagedragdrop plugin.
 *
 * This plugin adds the ability to drop an image in and have it auto-upload
 * into the Moodle draft file area.
 *
 * @package    editor-atto
 * @copyright  2014 Paul Nicholls
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
M.atto_imagedragdrop = M.atto_imagedragdrop || {

    /**
     * Add event listeners.
     *
     * @method init
     * @param {Object} params
     */
    init : function(params) {
        var self = this;
        var editable = M.editor_atto.get_editable_node(params.elementid);
        editable.on('drop', function(e) {
            M.editor_atto.save_selection(params);
            e = e._event;
            // Only handle the event if an image file was dropped in.
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length && /^image\//.test(e.dataTransfer.files[0].type)) {
                e.preventDefault();
                e.stopPropagation();
                var options = M.editor_atto.filepickeroptions[params.elementid]['image'];
                var formData = new FormData();

                formData.append('repo_upload_file', e.dataTransfer.files[0]);
                formData.append('itemid', options.itemid);
                // List of repositories is an object rather than an array.  This makes iteration more awkward.
                var i=0;
                while (true) {
                    if (options.repositories[++i] === undefined) {
                        // No more repos in list.  This is a problem, but we'll get an error back anyway so we'll handle it later.
                        break;
                    }
                    if (options.repositories[i].type === 'upload') {
                        formData.append('repo_id', options.repositories[i].id);
                        break;
                    }
                }
                formData.append('env', options.env);
                formData.append('sesskey', M.cfg.sesskey);
                formData.append('client_id', options.client_id);
                formData.append('savepath', options.savepath);
                formData.append('ctx_id', options.context.id);

                // Insert spinner as a placeholder.
                var timestamp = new Date().getTime();
                var uploadid = 'moodleimage_' + Math.round(Math.random()*100000)+'-'+timestamp;
                var args = {
                    src: M.util.image_url("i/loading_small", 'moodle'),
                    id: uploadid, 'class': 'mceNonEditable'
                };

                M.editor_atto.focus(params.elementid);
                M.editor_atto.restore_selection(e, params.elementid);
                imagehtml = '<img id="' + uploadid + '" src="' + Y.Escape.html(args.src) + '" alt="' + Y.Escape.html('loading...') + '"/>';
                M.editor_atto.insert_html_at_focus_point(imagehtml);
                M.editor_atto.text_updated(params.elementid);

                var xhr = new XMLHttpRequest();

                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        var editable = M.editor_atto.get_editable_node(params.elementid);
                        var placeholder = editable.one('#' + uploadid);
                        if (xhr.status === 200) {
                            var result = JSON.parse(xhr.responseText);
                            if (result) {
                                if (result.error) {
                                    if (placeholder) {
                                        placeholder.remove(true);
                                    }
                                    return new M.core.ajaxException(result);
                                }

                                var file = result;
                                if (result.event && result.event === 'fileexists') {
                                    // A file with this name is already in use here - rename to avoid conflict.
                                    // Chances are, it's a different image (stored in a different folder on the user's computer).
                                    // If the user wants to reuse an existing image, they can copy/paste it within the editor.
                                    file = result.newfile;
                                }

                                // Replace placeholder with actual image.
                                var filename = file.filename || file.file;
                                var newhtml = '<img src="' + Y.Escape.html(file.url) + '" alt="' + Y.Escape.html(filename) + '"/>';
                                var newimage = Y.Node.create(newhtml);
                                if (placeholder) {
                                    placeholder.replace(newimage);
                                } else {
                                    editable.appendChild(newimage);
                                }
                                M.editor_atto.text_updated(params.elementid);
                            }
                        } else {
                            alert(M.util.get_string('servererror', 'moodle'));
                            if (placeholder) {
                                placeholder.remove(true);
                            }
                        }
                    }
                };

                // Send the AJAX call.
                xhr.open("POST", M.cfg.wwwroot + '/repository/repository_ajax.php?action=upload', true);
                xhr.send(formData);
                return false;
            }
        }, this);
    }

};


}, '@VERSION@', {"requires": ["node", "escape"]});
