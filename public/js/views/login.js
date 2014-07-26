define(['CoBoView', 'text!templates/login.html'], function(CoBoView, loginTemplate) {
    var loginView = CoBoView.extend({
        requireLogin: false,

        el: $('#content'),

        events: {
            "click #login-submit": "login",
            "click #register-submit": "register"
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

        register: function() {
            var school_email = $('input[name=remail]').val().trim();
            var regex = /[a-zA-Z0-9_-]+@macalester\.edu/;

            if (regex.test(school_email)) {
                $.post('/api/register', {
                    email: $('input[name=remail]').val(),
                    first_name: $('input[name=rfirst_name]').val(),
                    last_name: $('input[name=rlast_name]').val(),
                    password: $('input[name=rpassword]').val()
                }, function(data) {
                    $("#login_form").show();
                    $("#load_register").show();
                    $("#register_form").hide();
                    $("#load_login").hide();
                    $("#error").text('Verification email has been sent to your email address!');
                    $("#error").slideDown();
                }).error(function() {
                        $(".error").text('Unable to register.');
                        $(".error").slideDown();
                    });
            } else {
                $(".error").text('Please use your school email address!');
                $(".error").slideDown();
            }
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