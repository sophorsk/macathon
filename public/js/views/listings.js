define(['CoBoView', 'text!templates/listings.html', 'views/item', 'models/Item'],
    function(CoBoView, listingTemplate, ItemView, Item) {

        var listingsView = CoBoView.extend({
            el: $("content"),

            events: {
                "submit form": "postItem"
            },

            postItem: function() {
                console.log(this.model.toJSON());
                var $messageArea = this.$('.messageArea');
                $.post('/api/post_item', {
                    name: $('input[name=name]').val(),
                    category: $('select.category option:selected').val(),
                    description: $('input[name=description]').val(),
                    price_in_cents: $('input[name=price_in_cents]').val()
                }, function(data) {
                    $messageArea.text('Item Posted !');
                }).error(function() {
                        $messageArea.text('Cannot post item !');
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

                $(itemHtml).prependTo('.sell_items').hide().fadeIn('slow');
            },

            render: function() {
                this.$el.html(listingTemplate);
            }
        });

        return listingsView;
    })