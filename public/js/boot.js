/**
 * The bootstrapper object instantiates the global configuration and establishes
 * module dependencies.
 */
require.config({
    paths: {
        jQuery: '/js/libs/jquery',
        jQueryMigrate: '/js/libs/jquery-migrate',
        Underscore: '/js/libs/underscore',
        Bootstrap: '/js/libs/bootstrap',
        Magnific: '/js/libs/magnific-popup',
        Backbone: '/js/libs/backbone',
        async : '/js/libs/async',
        models: 'models',
        text: '/js/libs/text',
        templates: '../templates',
        CoBoView: '/js/CoBoView'
    },

    shim: {
        'Magnific': ['jQuery'],
        'Bootstrap': ['jQuery'],
        'Backbone': ['Underscore', 'jQuery'],
        'CoBo': ['Backbone', 'Magnific', 'Bootstrap']
    }
});

require(['CoBo'], function(CoBo) {
    CoBo.initialize();
});