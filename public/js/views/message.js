define(['CoBoView', 'text!templates/message.html'],
    function(CoBoView, messageTemplate) {

        var messageView = CoBoView.extend({
            tagName: 'li',

            events: {
                "click .sendMessage": "sendMessage"
            },

            sendMessage: function() {
                console.log(this.model.toJSON());
                var $messageArea = this.$('.messageArea');
                $.post('/sendmsg'/ + this.model.id, {
                    text: $('input[name=email]').val(),
                    recipient: this.model.id
                }, function(data) {
                    $messageArea.text('Message Sent !');
                }).error(function() {
                        $messageArea.text('Cannot send message !');
                    });
            },

            render: function() {
                this.$el.html(messageTemplate);
            }
        });

        return messageView;
})