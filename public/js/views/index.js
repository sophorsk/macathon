define(["CoBoView", 'text!templates/index.html', "views/item", "models/Item"],
    function(CoBoView, indexTemplate, ItemView, Item) {

        var indexView = CoBoView.extend({

            el: $('#content'),

            events: {
                "submit .search_form": "searchItems"
            },

            searchItems: function() {
                var view = this;
                $.post('/items/search',
                    this.$('form').serialize(),
                    function(data) {
                        view.render(data);
                    }).error(function() {
                        $('.all_items').text('No items found !');
                        $('.all_items').slideDown();
                    });
                return false;
            },

            initialize: function() {
                this.collection.on('reset', this.onItemCollectionReset, this);
            },

            onItemCollectionReset: function(collection) {
                var that = this;
                collection.each(function(item) {
                    that.onItemAdded(item);
                })
            },

            onItemAdded: function(item) {
                var itemHtml = (new ItemView({
                    model: item
                })).render().el;
                $(itemHtml).prependTo('.all_items').hide().fadeIn('slow');
            },

            render: function(resultList) {
                this.$el.html(indexTemplate);

                if (resultList != null) {
                    _.each(resultList, function(itemJson) {

                        // get each contact on resultList
                        var itemModel = new Item(itemJson);
                        var itemHtml = (new ItemView(
                            {model: itemModel }
                        )).render().el;

                        $('.all_items').append(itemHtml);
                    });
                }
            }
        });

        return indexView;

});