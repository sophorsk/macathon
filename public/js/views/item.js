define(['CoBoView', 'text!templates/item.html', 'views/message'],
    function(CoBoView, itemTemplate, MessageView) {
        var itemView = CoBoView.extend({
            tagName: 'li',

            events: {
                "click .loadMessagePage": "loadMessagePage",
                "hover ": "loadDetails"
            },

            loadDetails: function() {

            },

            loadMessagePage: function() {
                this.messageView = new MessageView();
                this.$el.append(this.messageView.render());
            },

            render: function() {
                var item = this.model.toJSON();
                item.seller_name = "Seller " + item.seller;
                $.ajax({
                   url : '/api/accounts/' + item.seller,
                   type : 'GET',
                   dataType : 'json',
                   async : false,
                   success : function(account) {
                       console.log("Got account: " + account);
                       item.seller_name = account.first_name + ' ' + account.last_name[0] + '.';
                   }
                });
                this.$el.html(_.template(itemTemplate, item));
                return this;
            }
        });

        return itemView;
})
