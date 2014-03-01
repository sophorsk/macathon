define(['CoBoView', 'text!templates/item.html', 'views/message'],
    function(CoBoView, itemTemplate, MessageView) {
        var itemView = CoBoView.extend({
            tagName: 'li',

            events: {
                "click .loadMessagePage": "loadMessagePage"
            },

            loadMessagePage: function() {
                this.messageView = new MessageView();
                this.$el.append(this.messageView.render().el );
            },

            render: function() {
                $(this.el).html(_.template(itemTemplate, this.model.toJSON()));
                return this;
            }
        });

        return itemView;
})