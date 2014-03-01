/**
 * The bootstrapper object instantiates the global configuration and establishes
 * module dependencies.
 */
require.config({
    paths: {
        jQuery: '/js/libs/jquery',
        Underscore: '/js/libs/underscore',
        Backbone: '/js/libs/backbone',
        async : '/js/libs/async',
        text: '/js/libs/text',
        models: 'models',
        templates: '../templates',
        CoBoView: '/js/CoBoView'
    },

    shim: {
        'Backbone': ['Underscore', 'jQuery'],
        'CoBo': ['Backbone']
    }
});

require(['CoBo'], function(CoBo) {
    CoBo.initialize();
});