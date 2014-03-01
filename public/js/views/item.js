define(['CoBoView', 'text!templates/item.html'],
    function(CoBoView, itemTemplate) {
        var itemView = CoBoView.extend({
            tagName: 'li',

            events: {
                "click .sendMessage": "sendMessage"
            },

            sendMessage: function() {
                console.log(this.model.toJSON());
                $.ajax({
                    url: '/accounts/'
                })
            },

            render: function() {
                $(this.el).html(_.template(itemTemplate, this.model.toJSON()));
                return this;
            }
        });

        return itemView;
})