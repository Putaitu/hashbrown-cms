'use strict';

/**
 * The client side Connection class
 *
 * @memberof HashBrown.Client.Entity.Resource
 */
class Connection extends require('Common/Entity/Resource/Connection') {
    /**
     * Structure
     */
    structure() {
        super.structure();

        this.def(Object, 'deployer', {});
        this.def(String, 'processor');
    }
}

module.exports = Connection;
