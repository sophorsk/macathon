define(['CoBoView', 'text!templates/profile.html'],
    function(CoBoView, profileTemplate) {

        var profileView = CoBoView.extend({

            el: $('#content'),

            initialize: function() {
                this.model.bind('change', this.render, this);
            },

            getData: function(url) {
                var model = null;
                $.ajax({
                    url: url,
                    type: 'GET',
                    dataType: 'json',
                    async: false,
                    success: function(data) {
                        model = data;
                    }
                });
                return model;
            },

            render: function() {
                var urlCurrent = '/api/accounts/me';
                var account = this.getData(urlCurrent);

                this.$el.html(
                    _.template(profileTemplate, account)
                );

            }
        });

        return profileView;
});