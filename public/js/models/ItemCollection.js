define(['models/Item'], function(Item) {
    var ItemCollection = Backbone.Collection.extend({
        model: Item
    });

    return ItemCollection;
})