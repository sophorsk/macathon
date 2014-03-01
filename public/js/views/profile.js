define(['CoBoView', 'text!templates/profile.html'],
    function(CoBoView, profileTemplate) {
        var profileView = CoBoView.extend({
            el: $('#content'),

            initialize: function() {
                console.log(this.model.toJSON());
            },

            render: function() {
                this.$el.html(
                    _.template(profileTemplate, this.model.toJSON())
                );

            }
        });

        return profileView;
});