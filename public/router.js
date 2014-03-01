define(["views/index", "views/profile", "views/login"],
    function(IndexView, ProfileView, LoginView) {
    var ApplicationRouter = Backbone.Router.extend({

        currentView: null,

        routes: {
            "index": "index"
        },

        changeView: function(view) {
            if (null != this.currentView) {
                this.currentView.undelegateEvents();
            }
            this.currentView = view;
            this.currentView.render();
        },

        login: function() {
            this.changeView(new LoginView());
        },

        index: function() {
            this.changeView(new IndexView(

            ));
        },

        profile: function(id) {

        }
    });

    return new ApplicationRouter();
});