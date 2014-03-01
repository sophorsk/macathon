define(['CoBoView', 'text!templates/login.html'], function(CoBoView, loginTemplate) {
    var loginView = CoBoView.extend({
        requireLogin: false,

        el: $('#content'),

        events: {
            "click #login-submit": "login"
        },

        login: function() {
            $.post('/api/login', {
                email: $('input[name=email]').val(),
                password: $('input[name=password]').val()
            }, function(data) {
                window.location.hash = 'index';
            }).error(function(){
                    $("#error").text('Unable to login.');
                    $("#error").slideDown();
                });
            return false;
        },

        render: function() {
            this.$el.html(loginTemplate);
            $("#error").hide();
            $("input[name=email]").focus();
        }
    });

    return loginView;
});