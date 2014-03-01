define(["CoBoView", 'text!templates/index.html', "views/item"],
    function(CoBoView, indexTemplate, ItemView) {

        var indexView = CoBoView.extend({

            el: $('#content'),

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

            render: function() {
                this.$el.html(indexTemplate);
            }
        });

        return indexView;

});