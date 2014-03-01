define(function(require) {
    var Item = Backbone.Model.extend({
        urlRoot: '/api/items'
    });

    return Item;
});