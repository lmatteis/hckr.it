var comments = {
    getCommentsByParentId: function(level, parentId) {
        var $comments = $('.comments [parent_id="' + parentId + '"]');

        // sort these comments by score
        $comments.sort(function(a, b) {
            var k1 = parseFloat($(a).attr('score'), 10); 
            var k2 = parseFloat($(b).attr('score'), 10);
            return (k1 > k2) ? 1 : ( (k2 > k1) ? -1 : 0 );
        });

        $comments.each(function() {
            // let's clone it so it doesn't effect the actual HTML
            var $this = $(this).clone();
            $this.show();
            // show them by appending at this level
            if(!level) {
                $this.insertAfter('.comments');
            } else {
                // get the level width property
                // and add 40 to it
                var width = level.find('.level').attr('width');
                $this.find('.level').attr('width', parseInt(width, 10) + 40);
                $this.insertAfter(level);
            }
            comments.getCommentsByParentId($this, $this.attr('comment_id'));
        });
    },
    voteBind: function() {
        $('.voteup').live('click', function(e) {
            var $this = $(this);
            var docId = $this.attr('doc_id');
            var commentId = $this.attr('comment_id');

            var url = '';
            var data = {};
            if(docId) {
                url = '/_update/voteup/' + docId;
            } else if(commentId) {
                // get the docId from the form
                docId = $('.addcomment').attr('doc_id'); 
                url = '/_update/commentvoteup/' + docId;
                data.comment_id = commentId;
            }

            $.ajax({
                url: url,
                type: 'PUT',
                data: data,
                dataType: 'json',
                complete: function(req) {
                    if (req.status == 200 || req.status == 201 || req.status == 202) {
                        $this.css('visibility', 'hidden'); 
                    }
                },
                error: function() {

                }
            });
            e.stopPropagation();
            e.preventDefault();
        });
    },
    commentBind: function() {
        $('.addcomment').live('submit', function(e) {
            var $this = $(this);
            var data = $this.serialize();
            var docId = $this.attr('doc_id');
            $.ajax({
                url: '/_update/comment/' + docId,
                type: 'PUT',
                data: data,
                dataType: 'json',
                complete: function() {
                    if (req.status == 200 || req.status == 201 || req.status == 202) {
                        location.reload();
                    }
                }
            });

            e.stopPropagation();
            e.preventDefault();
        });

        $('.commentreply').click(function(e) {
            var $this = $(this);
            var $form = $('.addcomment').clone();

            var commentId = $this.attr('comment_id');

            // change the parent_id to be what we just clicked on
            $form.find('[name=parent_id]').val(commentId);
            var $submit = $form.find('input[type=submit]');
            $submit.val('reply');
            $cancel = $('<input type="button" class="cancelreply" value="cancel" />');
            $cancel.click(function() {
                $form.remove();
            });
            $form.append($cancel);

            $form.insertAfter($this);

            e.stopPropagation();
            e.preventDefault();
        });
    }
};

var auth = {
    logout: function() {
        $.ajax({
            url: '/_session',
            type: 'DELETE',
            username: '_',
            password: '_',
            dataType: 'json',
            success: function() {
                location.reload();
            }
        });
    },
    bind: function() {
        $('.logout').click(function(e) {
            auth.logout(); 
            e.preventDefault();
            e.stopPropagation();
        });
        $('.login').submit(function(e) {
            var data = $(this).serialize();
            $.post('/_session', data)
            .error(function(jqXHR) {
                var j = $.parseJSON(jqXHR.responseText);
                $('.error').text(j.reason);
            })
            .success(function() {
                $(location).attr('href', '/');
            });
            
            e.preventDefault();
        });
    }
};

var item = {
    submit: function() {
        $('.item-submit').submit(function(e) {
            var data = $(this).serialize();
            $.post('/r', data)
            .error(function(jqXHR) {
                var j = $.parseJSON(jqXHR.responseText);
                $('.error').text(j.reason);
            })
            .success(function() {
                $(location).attr('href', '/');
            });

            e.preventDefault();
        });
    }
};
