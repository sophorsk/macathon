define(['models/Profile'], function(Profile) {
    var ProfileCollection = Backbone.Collection.extend({
        model: Profile
    });

    return ProfileCollection;
});