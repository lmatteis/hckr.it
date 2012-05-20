var comments = {
    getCommentsByParentId: function(level, parentId) {
        var $comments = $('.comments [parent_id=' + parentId + ']');

        // sort these comments by points
        $comments.sort(function(a, b) {
            var k1 = parseInt($(a).attr('points'), 10); 
            var k2 = parseInt($(b).attr('points'), 10);
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
            comments.getCommentsByParentId($this, $this.attr('doc_id'));
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
                var j = JSON.parse(jqXHR.responseText);
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
                var j = JSON.parse(jqXHR.responseText);
                $('.error').text(j.reason);
            })
            .success(function() {
                $(location).attr('href', '/');
            });

            e.preventDefault();
        });
    }
};
