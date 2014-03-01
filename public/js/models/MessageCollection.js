define(['models/Message'], function(Message) {
    var MessageCollection = Backbone.Collection.extend({
        model: Message
    });

    return MessageCollection;
});