define(["CoBoView", 'text!templates/index.html', "views/item", "models/Item"],
    function(CoBoView, indexTemplate, ItemView, Item) {

        var indexView = CoBoView.extend({

            el: 'body',

            events: {
                "click .sell_item": "sellItem",
                "click .search_item": "searchItems"
            },

            sellItem: function() {
                var $messageArea = this.$('.messageArea');
                $.post('/api/post_item', {
                    name: $('input[name=name]').val(),
                    category: $('select.category option:selected').val(),
                    description: $('input[name=description]').val(),
                    price_in_cents: $('input[name=price_in_cents]').val()
                }, function(data) {
                    $messageArea.text('Your item has been posted!');
                }).error(function() {
                    $messageArea.text('Your item cannot be posted!');
                });
                return false;
            },

            searchItems: function() {
                var view = this;
                $.get('/api/items', {
                        category: $('select.category option:selected').val(),
                        q: $('input[name=searchString]').val()
                    },
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
                    //console.log(item.toJSON());
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
                        // get each item from resultList
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