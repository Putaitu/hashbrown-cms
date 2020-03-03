'use strict';

/**
 * @namespace HashBrown.Server.Controller
 */
namespace('Controller')
.add(require('./ControllerBase'))
.add(require('./InputController'))
.add(require('./ResourceController'))
.add(require('./ConfigController'))
.add(require('./ConnectionController'))
.add(require('./ContentController'))
.add(require('./FormController'))
.add(require('./MediaController'))
.add(require('./ScheduleController'))
.add(require('./SchemaController'))
.add(require('./ServerController'))
.add(require('./SettingsController'))
.add(require('./SyncController'))
.add(require('./TestController'))
.add(require('./UserController'))
.add(require('./ViewController'));
