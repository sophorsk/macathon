define(["views/index", "views/profile", "views/login", "models/Item", "models/ItemCollection"],
    function(IndexView, ProfileView, LoginView, Item, ItemCollection) {

        var ApplicationRouter = Backbone.Router.extend({

        currentView: null,

        routes: {
            "index": "index",
            "login": "login",
            "profile": "profile",
            "listings": "listings",
            "messages": "messages"
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
            var itemCollection = new ItemCollection();
            itemCollection.url = '/api/items';

            this.changeView(new IndexView( {
                collection: itemCollection
            }));

            itemCollection.fetch();
        },

        profile: function(id) {
            var model = new Account({id: id});

        },

        item: function(itemId) {
            var model = new Item({id: itemId});
            this.changeView(new ItemProfile({model: model}));
            model.fetch();
        }
    });

    return new ApplicationRouter();
});