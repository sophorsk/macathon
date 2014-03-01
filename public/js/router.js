define(["views/index", "views/profile", "views/login", "models/Item", "models/ItemCollection", "views/listings", "models/Profile"],
    function(IndexView, ProfileView, LoginView, Item, ItemCollection, ListingsView, Profile) {

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

        profile: function() {
            var id = "me";
            var model = new Profile({id: id});
            this.changeView(new ProfileView({ model: model}));
            model.fetch();
        },

        index: function() {
            var itemCollection = new ItemCollection();
            itemCollection.url = '/api/items';

            this.changeView(new IndexView( {
                collection: itemCollection
            }));
            itemCollection.fetch();
        },

        listings: function() {
            var sellingCollection = new ItemCollection();
            sellingCollection.url = "/api/accounts/me/items";

            this.changeView(new ListingsView({
                collection: sellingCollection
            }));
            sellingCollection.fetch();
        }
    });

    return new ApplicationRouter();
});