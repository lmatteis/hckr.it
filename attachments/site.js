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
            /*
            var $this = $(this).clone();
            $(this).remove(); // we can remove the current comment, not using it - it's for hashbangs ot work!
            */

            var $this = $(this);

            $this.show();
            // show them by appending at this level
            if(!level) {
                $('.comments').prepend($this)
            } else {
                // get the level width property
                // and add 40 to it
                var width = level.find('.level').prop('width');
                $this.find('.level').attr('width', parseInt(width, 10) + 40);
                $this.insertAfter(level);
            }
            comments.getCommentsByParentId($this, $this.attr('comment_id'));
        });
    },
    voteBind: function() {
        $(document).on('click', '.voteup', function(e) {
            var $this = $(this);
            var docId = $this.attr('doc_id');
            var commentId = $this.attr('comment_id');

            var url = '';
            var data = {};
            if(docId) {
                url = '_update/voteup/' + docId;
            } else if(commentId) {
                // get the docId from the form
                docId = $('.addcomment').attr('doc_id'); 
                url = '_update/commentvoteup/' + docId;
                data.comment_id = commentId;
            }

            $.ajax({
                url: url,
                type: 'PUT',
                data: data,
                complete: function(req) {
                    if (req.status == 200 || req.status == 201 || req.status == 202) {
                        $this.css('visibility', 'hidden'); 
                    }
                },
                error: function(req) {
                    var j = $.parseJSON(req.responseText);
                    if(j.reason === 'Must be logged on') {
                        $(location).attr('href', 'login');
                    }
                }
            });
            e.stopPropagation();
            e.preventDefault();
        });
    },
    commentBind: function() {
        $(document).on('submit', '.addcomment', function(e) {
            var $this = $(this);
            var data = $this.serialize();
            var docId = $this.attr('doc_id');
            $.ajax({
                url: '_update/comment/' + docId,
                type: 'PUT',
                data: data,
                complete: function(req) {
                    if (req.status == 200 || req.status == 201 || req.status == 202) {
                        location.reload();
                    }
                },
                error: function(req) {
                    var j = $.parseJSON(req.responseText);
                    var $error = $this.find('.error');
                    $error.show();
                    $error.text(j.reason)
                }
            });

            e.stopPropagation();
            e.preventDefault();
        });

        $('.commentreply').click(function(e) {
            var $this = $(this);
            $('.error').hide();
            var $form = $('.addcomment:first').clone();

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

            $form.insertAfter($this.parent());

            e.stopPropagation();
            e.preventDefault();
        });
    },
    scroll: function() {
        if (location.hash) {
            window.location.hash = location.hash;
            window.location.href = location.hash;
        }
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
    signup: function($form) {
        var username = $form.find('[name=u]').val();
        var password = $form.find('[name=p]').val();

        var userDoc = {
            name: username,
            password: password,
            roles: [],
            type: 'user',
            _id: 'org.couchdb.user:' + encodeURIComponent(username)
        };
        $.ajax({
            url: '/_users/' + userDoc._id,
            type: 'PUT',
            data: JSON.stringify(userDoc),
            dataType: 'json',
            contentType: 'application/json',
            complete: function(req) {
                var resp = $.parseJSON(req.responseText);
                if (req.status == 200 || req.status == 201 || req.status == 202) {
                    auth.login(username, password);
                }
            },
            error: function(req) {
                var j = $.parseJSON(req.responseText);
                $('.signup_error').text(j.reason);
            }
        });
    },
    login: function(username, password) {
        $.post('/_session', { name: username, password: password })
        .error(function(req) {
            var j = $.parseJSON(req.responseText);
            $('.login_error').text(j.reason);
        })
        .success(function() {
            $(location).attr('href', '.');
        });
    },
    bind: function() {
        $('.logout').click(function(e) {
            auth.logout(); 
            e.preventDefault();
            e.stopPropagation();
        });
        $('.login').submit(function(e) {
            var $form = $(this);
            var username = $form.find('[name=name]').val();
            var password = $form.find('[name=password]').val();

            auth.login(username, password);
            
            e.preventDefault();
        });
        $('.signup').submit(function(e) {
            auth.signup($(this)); 
            e.preventDefault();
            e.stopPropagation();
        });
    }
};

var item = {
    submit: function() {
        $('.item-submit').submit(function(e) {
            var data = $(this).serialize();
            $.post('r', data)
            .error(function(jqXHR) {
                var j = $.parseJSON(jqXHR.responseText);
                $('.error').text(j.reason);
            })
            .success(function() {
                $(location).attr('href', '.');
            });

            e.preventDefault();
        });
    }
};

var user = {
    submit: function() {
        $('.user-submit').submit(function(e) {
            var data = $(this).serialize();

            $.ajax({
                url: '_update/user/' + $('[name=username]').val(),
                type: 'PUT',
                data: data,
                complete: function(req) {
                    if (req.status == 200 || req.status == 201 || req.status == 202) {
                        location.reload();
                    }
                },
                error: function(req) {
                    var j = $.parseJSON(req.responseText);
                    $('.error').text(j.reason);
                }
            });

            e.preventDefault();
        });
    }
};

var karma = {
    getKarma: function() {
        var username = $('.username').text();
        if(!username) return;
        $.getJSON('karma', { user: username }, function(data) {
            var karma = data.rows[0].value;
            $('.karma').text(karma);
        });
    }
}
