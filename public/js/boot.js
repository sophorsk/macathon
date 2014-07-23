/**
 * The bootstrapper object instantiates the global configuration and establishes
 * module dependencies.
 */
require.config({
    paths: {
        jQuery: '/js/libs/jquery',
        Underscore: '/js/libs/underscore',
        Bootstrap: '/js/libs/bootstrap.min',
        Backbone: '/js/libs/backbone',
        async : '/js/libs/async',
        models: 'models',
        text: '/js/libs/text',
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