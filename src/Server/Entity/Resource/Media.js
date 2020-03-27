'use strict';

const Path = require('path');

const MAX_CACHE_TIME = 1000 * 60 * 60 * 24 * 10 // 10 days

/**
 * The media resource
 *
 * @memberof HashBrown.Server.Entity.Resource
 */
class Media extends require('Common/Entity/Resource/Media') {
    /**
     * Gets the media provider connection
     *
     * @param {String} projectId
     * @param {String} environment
     *
     * @return {HashBrown.Entity.Resource.Connection} Connection
     */
    static async getProvider(projectId, environment) {
        checkParam(projectId, 'projectId', String, true);
        checkParam(environment, 'environment', String, true);
        
        let project = await HashBrown.Entity.Project.get(projectId);

        if(!project) {
            throw new Error(`Project ${projectId} not found`);
        }

        let environments = await project.getSettings('environments');

        if(!environments || !environments[environment] || !environments[environment].mediaProvider) { return null; }

        let connection = await HashBrown.Entity.Resource.Connection.get(projectId, environment, environments[environment].mediaProvider);

        return connection;
    }
    
    /**
     * Sets the media provider connection
     *
     * @param {String} projectId
     * @param {String} environment
     * @param {String} connectionId
     */
    static async setProvider(projectId, environment, connectionId) {
        checkParam(projectId, 'project', String, true);
        checkParam(environment, 'environment', String, true);
        checkParam(connectionId, 'connectionId', String, true);
        
        let project = await HashBrown.Entity.Project.get(projectId);

        if(!project) {
            throw new Error(`Project ${projectId} not found`);
        }
        
        let connection = await HashBrown.Entity.Resource.Connection.get(projectId, environment, connectionId);

        if(!connection) {
            throw new Error(`Connection ${connectionId} not found`);
        }

        let settings = await project.getEnvironmentSettings(environment) || {};

        settings.mediaProvider = connectionId;

        project.setEnvironmentSettings(environment, settings);
    }
    
    /**
     * Creates a new instance of this entity type
     *
     * @param {HashBrown.Entity.User} user
     * @param {String} project
     * @param {String} environment
     * @param {Object} data
     * @param {Object} options
     *
     * @return {HashBrown.Entity.Resource.Media} Instance
     */
    static async create(user, project, environment, data = {}, options = {}) {
        checkParam(user, 'user', HashBrown.Entity.User, true);
        checkParam(project, 'project', String, true);
        checkParam(environment, 'environment', String, true);
        checkParam(data, 'data', Object, true);
        checkParam(data.filename, 'data.filename', String, true);
        checkParam(options, 'options', Object, true);
        checkParam(options.base64, 'options.base64', String, true);
        
        let connection = await this.getProvider(project, environment);

        if(!connection) {
            throw new Error('No connection set as media provider');
        }

        let resource = await super.create(user, project, environment, data, options);

        await connection.setMedia(resource.id, data.filename, options.base64);

        return resource;
    }
    
    /**
     * Gets a list of instances of this entity type
     *
     * @param {String} project
     * @param {String} environment
     * @param {Object} options
     *
     * @return {Array} Instances
     */
    static async list(project, environment, options = {}) {
        checkParam(project, 'project', String, true);
        checkParam(environment, 'environment', String, true);
        checkParam(options, 'options', Object, true);

        let connection = await this.getProvider(project, environment);

        if(!connection) { return []; }

        // Make sure we include all media items, even ones not in the database
        let resources = await super.list(project, environment, options);

        let filenames = await connection.getAllMediaFilenames();
        
        for(let resource of resources) {
            if(filenames[resource.id]) { 
                delete filenames[resource.id];
            }
        }

        for(let id in filenames) {
            let resource = new Media({
                id: id,
                name: filenames[id]
            });

            resources.push(resource);
        }

        return resources;
    }
    
    /**
     * Removes this entity
     *
     * @param {HashBrown.Entity.User} user
     * @param {String} project
     * @param {String} environment
     * @param {Object} options
     */
    async remove(user, project, environment, options = {}) {
        checkParam(user, 'user', HashBrown.Entity.User, true);
        checkParam(project, 'project', String, true);
        checkParam(environment, 'environment', String, true);
        checkParam(options, 'options', Object, true);

        await this.clearCache(project, environment);
        
        await super.remove(user, project, environment, options);
        
        let connection = await this.constructor.getProvider(project, environment);

        if(!connection) {
            throw new Error('No connection set as media provider');
        }

        await connection.removeMedia(this.id);
    }

    /**
     * Saves the current state of this entity
     *
     * @param {HashBrown.Entity.User} user
     * @param {String} project
     * @param {String} environment
     * @param {Object} options
     */
    async save(user, project, environment, options = {}) {
        checkParam(user, 'user', HashBrown.Entity.User, true);
        checkParam(project, 'project', String, true);
        checkParam(environment, 'environment', String, true);
        checkParam(options, 'options', Object, true);

        let connection = await this.constructor.getProvider(project, environment);

        if(!connection) {
            throw new Error('No connection set as media provider');
        }

        await connection.renameMedia(this.id, this.filename);

        if(options.base64) {
            await connection.setMedia(this.id, this.filename, options.base64);
        }

        await this.clearCache(project, environment);
        
        await super.save(user, project, environment);
    }
   
    /**
     * Clears the cache for this media item
     *
     * @param {String} project
     * @param {String} environment
     */
    async clearCache(project, environment) {
        checkParam(project, 'project', String, true);
        checkParam(environment, 'environment', String, true);

        let cacheFolder = Path.join(APP_ROOT, 'storage', project, environment, 'media', this.id);

        await HashBrown.Service.FileService.remove(cacheFolder);
    }

    /**
     * Get the cache for this media item
     *
     * @param {String} project
     * @param {String} environment
     * @param {Number} width
     * @param {Number} height
     *
     * @returns {FileSystem.ReadStream} Binary data stream
     */
    async getCache(project, environment, width, height = 0) {
        checkParam(project, 'project', String, true);
        checkParam(environment, 'environment', String, true);
        checkParam(width, 'width', Number);
        checkParam(height, 'height', Number);

        let size = '';

        if(width) {
            size += 'w' + width;
        }
        
        if(height) {
            size += 'h' + height;
        }

        if(size) {
            size = '_' + size;
        }

        let cacheFolder = Path.join(APP_ROOT, 'storage', project, environment, 'media', this.id);
        let cacheFile = Path.join(cacheFolder, 'img' + size + '.jpg');
        
        // Create the cache folder, if it doesn't exist
        await HashBrown.Service.FileService.makeDirectory(cacheFolder);

        // Get file stats
        let stats = await HashBrown.Service.FileService.stat(cacheFile);

        // File was OK, return it
        if(stats && new Date().getTime() - new Date(stats.atime).getTime() < MAX_CACHE_TIME) {
            return HashBrown.Service.FileService.readStream(cacheFile);
        }
        
        // Remove file, if it exists
        await HashBrown.Service.FileService.remove(cacheFile);
        
        // Procure the URL from the providing connection
        let connection = await this.constructor.getProvider(project, environment);

        if(!connection) {
            throw new Error('No connection set as media provider');
        }

        let url = await connection.getMediaUrl(this.id);

        if(!url) {
            throw new Error(`Cannot fetch media "${this.id}", no URL available from provider`);
        }

        await HashBrown.Service.FileService.copy(url, cacheFile);

        // Resize file
        if(width && this.isImage() && !this.isSvg()) { 
            await HashBrown.Service.AppService.exec('convert ' + cacheFile + ' -auto-orient -resize ' + width + (height ? 'x' + height : '') + '\\> ' + cacheFile);
        }
        
        // Read file
        return HashBrown.Service.FileService.readStream(cacheFile);
    }
    
    /**
     * Cleans the entire media cache
     *
     * @param {String} project
     * @param {String} environment
     */
    static async clearCache(project, environment) {
        checkParam(project, 'project', String);
        checkParam(environment, 'environment', String);

        let cacheFolders = Path.join(APP_ROOT, 'storage', project, environment, 'media', '*');
        let files = await HashBrown.Service.FileService.list(cacheFolders);
        
        for(let file of files) {
            await HashBrown.Service.FileService.remove(Path.join(cacheFolder, file));
        }
    }
}

module.exports = Media;