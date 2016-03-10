'use strict';

// Lib
let beautify = require('js-beautify').js_beautify;

// Views
let MessageModal = require('./MessageModal');

/**
 * A basic JSON editor for any object
 */
class JSONEditor extends View {
    constructor(params) {
        super(params);

        this.$element = _.div({class: 'json-editor flex-vertical'});
        this.$error = _.div({class: 'panel panel-danger'});

        this.fetch();
    }

    /**
     * Event: Click reload. Fetches the model again
     */
    onClickReload() {
        this.fetch();
    }

    /**
     * Event: Click save. Posts the model to the modelUrl
     */
    onClickSave() {
        let view = this;

        try {
            this.model = JSON.parse(this.value);

            $.post(this.modelUrl, this.model, function() {
                console.log('[JSONEditor] Saved model to ' + view.modelUrl);
            });

        } catch(e) {
            new MessageModal({
                model: {
                    title: 'Invalid JSON',
                    body: e
                }
            });

        }
    }

    /**
     * Event: Change text. Make sure the value is up to date
     */
    onChangeText($textarea) {
        this.value = $textarea.val();

        try {
            this.model = JSON.parse(this.value);
            this.$error.hide();

        } catch(e) {
            this.$error.html(e);
            this.$error.show();
        }
    }

    render() {
        let view = this;

        this.value = beautify(JSON.stringify(this.model));

        this.$element.html([
            _.textarea({class: 'flex-expand'},
                this.value
            ).bind('keyup change propertychange paste', function() { view.onChangeText($(this)); }),
            this.$error,
            _.div({class: 'panel panel-default panel-buttons'}, 
                _.div({class: 'pull-left btn-group flex-horizontal'}, [
                    _.button({class: 'btn btn-primary flex-expand'},
                        _.span({class: 'fa fa-refresh'})
                    ).click(function() { view.onClickReload(); }),
                    _.button({class: 'btn btn-success flex-expand'}, [
                        'Save ',
                        _.span({class: 'fa fa-save'})
                    ]).click(function() { view.onClickSave(); })
                ])
            )
        ]);
    }
}

module.exports = JSONEditor;