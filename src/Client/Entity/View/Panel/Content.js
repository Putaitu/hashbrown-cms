'use strict';

/**
 * A panel for content resources
 *
 * @memberof HashBrown.Entity.View.Panel
 */
class Content extends HashBrown.Entity.View.Panel.PanelBase {
    static get itemType() { return HashBrown.Entity.Resource.Content; }
    
    /**
     * Event: Click new
     */
    async onClickNew(parentId) {
        new HashBrown.Entity.View.Modal.CreateContent({
            model: {
                parentId: parentId
            }
        });
    }
    
    /**
     * Event: Drop item
     *
     * @param {String} itemId
     * @param {String} parentId
     * @param {Number} position
     */
    async onDropItem(itemId, parentId, position) {
        try {
            await HashBrown.Service.RequestService.request('post', `content/insert?contentId=${itemId}&parentId=${parentId || ''}&position=${position}`);

            this.update();

        } catch(e) {
            UI.error(e);

        }
    }
    
    /**
     * Gets available sorting options
     *
     * @return {Object} Options
     */
    getSortingOptions() {
        return {
            'Default': 'sort',
            'A-Z': 'name',
            'Changed': 'changed',
            'Created': 'created'
        }
    }
    
    /**
     * Gets the basic options for a resource
     *
     * @param {HashBrown.Entity.Resource.ResourceBase} resource
     *
     * @return {Object} Options
     */
    getItemBaseOptions(resource) {
        let options = super.getItemBaseOptions(resource);

        options['New child'] = () => this.onClickNew(resource.id);

        return options;
    }
    
    /**
     * Gets a panel item from a resource
     *
     * @param {HashBrown.Entity.Resource.Content} content
     *
     * @return {HashBrown.Entity.View.ListItem.PanelItem} Item
     */
    getItem(content) {
        let item = super.getItem(content);

        item.name = content.prop('title', HashBrown.Context.language) || content.id;
        item.parentId = content.parentId;
        item.sort = content.sort;
        item.isDraggable = true;
        item.isSortable = true;
        item.isDropContainer = true;
        item.changed = content.updateDate;
        item.created = content.createDate;

        return item;
    }
}

module.exports = Content;