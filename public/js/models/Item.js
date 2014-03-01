define(function(require) {
    var Item = Backbone.Model.extend({
        urlRoot: '/items/' + this.itemId
    });

    return Item;
});