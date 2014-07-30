define(['CoBoView', 'text!templates/login.html'], function(CoBoView, loginTemplate) {
    var loginView = CoBoView.extend({
        requireLogin: false,

        el: $('#content'),

        events: {
            "click #login-submit": "login",
            "click #register-submit": "register",
            "click #load_login": "load_login_form"
        },

        login: function() {
            $.post('/api/login', {
                email: $('input[name=email]').val(),
                password: $('input[name=password]').val()
            }, function(data) {
                window.location.hash = 'index';
            }).error(function(){
                    $("#login_error").text('Unable to login.');
                    $("#login_error").slideDown();
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
                    $("#login_error").text('Verification email has been sent to your email address!');
                    $("#login_error").slideDown();
                }).error(function() {
                        $("#reg_error").text('Unable to register.');
                        $("#reg_error").slideDown();
                    });
            } else {
                $("#reg_error").text('Please use your school email address!');
                $("#reg_error").slideDown();
            }
            return false;
        },

        load_login_form: function() {
            $("#register_form").hide();
            $("#load_login").hide();
            $("#login_form").show();
            $("#load_register").show();
            $(".error").hide();
            $('input[type=text]').val("");
            $('input[type=password]').val("");
        },

        render: function() {
            this.$el.html(loginTemplate);
            $(".error").hide();
            $("input[name=email]").focus();
        }
    });

    return loginView;
});