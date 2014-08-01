define(['CoBoView', 'text!templates/listings.html', 'views/item'],
    function(CoBoView, listingTemplate, ItemView) {

        var listingsView = CoBoView.extend({

            el: 'body',
            /*
            events: {
                "click .post_submit": "postItem"
            },*/
            /*
            postItem: function() {
                var $messageArea = this.$('.messageArea');

                $.post('/api/post_item', {
                    name: $('input[name=name]').val(),
                    category: $('select.category option:selected').val(),
                    description: $('input[name=description]').val(),
                    price_in_cents: $('input[name=price_in_cents]').val()
                }, function(data) {
                    console.log(data);
                    $messageArea.text('Your item has been posted!');
                }).error(function() {
                        $messageArea.text('Your item cannot be posted!');
                    });
                return false;
            },*/

            getData: function(url) {
                var model = null;
                $.ajax({
                    url: url,
                    type: 'GET',
                    dataType: 'json',
                    async: false,
                    success: function(data) {
                        model = data;
                    }
                });
                return model;
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

                $(itemHtml).prependTo('.sold_items').hide().fadeIn('slow');
            },

            render: function() {
                var urlCurrent = '/api/accounts/me';
                var account = this.getData(urlCurrent);

                this.$el.html(
                    _.template(listingTemplate, account)
                )
            }
        });

        return listingsView;
});