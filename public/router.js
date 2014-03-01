define(["views/index"],
    function(IndexView) {
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

        index: function() {
            this.changeView(new IndexView(

            ));
        }
    });

    return new ApplicationRouter();
});