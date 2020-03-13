'use strict';

/**
 * A editor of URLs with auto generate functionality
 *
 * @memberof {HashBrown.Client.Entity.View.Field}
 */
class UrlEditor extends HashBrown.Entity.View.Field.FieldBase {
    /**
     * Constructor
     */
    constructor(params) {
        super(params);

        this.editorTemplate = require('template/field/editor/urlEditor');
    }

    /**
     * Event: Clicked regenerate
     */
    async onClickRegenerate() {
        let editor = HashBrown.Context.currentResourceEditor;

        if(!editor || !editor.model) { return; }

        let content = editor.model;
        let url = '/';

        while(content) {
            let name = content.prop('title', HashBrown.Context.language) || content.id || '';

            name = name.toLowerCase();
            name = name.replace(/[^a-z0-9]/g, '');

            url = '/' + name + url;

            if(!content.parentId) { break; }

            content = await HashBrown.Entity.Resource.Content.get(content.parentId);
        }
        
        if(HashBrown.Context.projectSettings.languages.length > 1 && HashBrown.Context.language) {
            url = '/' + HashBrown.Context.language + url; 
        }

        url = url.replace(/\/\//g, '/');

        this.state.value = url;
        this.namedElements.input.value = this.state.value;

        this.onChange(this.state.value);
    }
    
    /**
     * Gets tools for this field
     *
     * @return {Array} Tools
     */
    getTools() {
        return [];
    }
}

module.exports = UrlEditor;
