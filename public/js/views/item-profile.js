define(['CoBoView', 'text!templates/item-profile.html'],
    function(CoBoView, itemProfileTemplate) {

        var itemProfile = CoBoView.extend({
            el: $('#content'),

            initialize: function() {

            },

            render: function() {
                var that = this;

                this.$el.html(
                    _.template(itemProfileTemplate)
                );

            }
        });

        return itemProfile;

})