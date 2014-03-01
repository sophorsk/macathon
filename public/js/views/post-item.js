define(['CoBoView', 'text!templates/post-item.html'],
    function(CoBoView, postItemTemplate) {

        var messageView = CoBoView.extend({
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

            render: function() {
                this.$el.html(postItemTemplate);
            }
        });

        return messageView;
    })