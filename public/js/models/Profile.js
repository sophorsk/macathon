define(function(require) {
    var Profile = Backbone.Model.extend({
        urlRoot: '/api/accounts/'
    })
    return Profile;
});