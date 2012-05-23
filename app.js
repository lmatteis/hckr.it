var couchapp = require('couchapp'), 
    path = require('path');

ddoc = { 
    _id:'_design/news',
    rewrites : [
        {from:'/', to:'_list/all/all', query: { descending: "true" } },
        {from:'/item', to:'_list/item/item', query: { key: ":id" } },
        {from:'/user', to:'_list/user/user', query: { key: ":id", group: "true" } },
        {from:'/about', to:'_show/about'},
        {from:'/login', to:'_show/login'},
        {from:'/submit', to:'_show/submit'},
        {from:'/r', to:'_update/item'},
        {from:'/*', to:'*'}
    ]
};

ddoc.views = {};
ddoc.views.all = {
    map: function(doc) {
        if(doc.type === 'item') {
            var util = require('views/lib/util');

            var points = util.getPoints(doc.voted);
            var score = util.findScore(points, doc.created_at);

            var numcomments = util.getNumComments(doc.comments);

            emit(score, {
                doc: doc,
                domain: util.getDomain(doc.url),
                points: points,
                numcomments: numcomments
            });
        }
    }
};
ddoc.views.item = {
    map: function(doc) {
        if(doc.type === 'item') {
            var util = require('views/lib/util');

            var points = util.getPoints(doc.voted);
            var score = util.findScore(points, doc.created_at);

            var numcomments = util.getNumComments(doc.comments);

            var comments = [];
            for(var i in doc.comments) {
                var c = doc.comments[i];
                var comment = {};

                // copy elements of comments since we
                // can't modify the object itself
                for(var x in c) {
                    comment[x] = c[x];
                }

                comment.points = util.getPoints(c.voted);
                comment.score = util.findScore(comment.points, c.comment_id);

                comments.push(comment);
            }

            emit(doc._id, {
                doc: doc,
                domain: util.getDomain(doc.url),
                points: points,
                numcomments: numcomments,
                comments: comments
            });
        }
    }
};

ddoc.views.user = {
    map: function(doc) {
        if(doc.type === 'item') {
            var util = require('views/lib/util');

            var points = util.getPoints(doc.voted);

            for(var i in doc.comments) {
                var comment = doc.comments[i];
                emit(comment.author, { points: util.getPoints(comment.voted) });
            }
            emit(doc.author, { points: points });
        }
    },
    reduce: function (key, values, rereduce) {
        var ret = {
            totalPoints: 0
        };
        if(!rereduce) {
            for(var i in values) {
                ret.totalPoints += values[i].points;
            }
        } else {
            for(var i in values) {
                ret.totalPoints += values[i].totalPoints;
            }
        }

        return ret;
    }
}

ddoc.lists = {};
ddoc.lists.all = function(head, req) {
    provides('html', function(){
        var row,
            Mustache = require('views/lib/mustache');
        var util = require('views/lib/util');

        var username = req.userCtx.name;

        var data = {
            title: '',
            username: username,
            login: !(username),
            rows: []
        };

        var counter = 0;
        while(row = getRow()) {
            var doc = row.value.doc;
            doc.domain = row.value.domain;
            doc.points = row.value.points;
            doc.numcomments = row.value.numcomments;

            doc.counter = ++counter;
            doc.pretty_date = util.timeDifference(new Date(), new Date(doc.created_at));

            doc.owner = (doc.author == req.userCtx.name);
            if(util.inArray(username, doc.voted)) {
                doc.upvoted = true;
            }

            data.rows.push(doc);
        }
        var html = Mustache.to_html(this.templates.all, data, this.templates.partials);
        return html;
    });
};

ddoc.lists.item = function(head, req) {
    provides('html', function(){
        var Mustache = require('views/lib/mustache');
        var util = require('views/lib/util');
        
        var username = req.userCtx.name;

        var value = getRow()['value'];
        var currDate = new Date();
        
        var doc = value.doc;
        doc.domain = value.domain;
        doc.points = value.points;
        doc.numcomments = value.numcomments;
        doc.pretty_date = util.timeDifference(currDate, new Date(doc.created_at));

        // check if we upvoted already
        if(util.inArray(username, doc.voted)) {
            doc.upvoted = true;
        }

        for(var i in value.comments) {
            var comment = value.comments[i];
            if(util.inArray(username, comment.voted)) {
                comment.upvoted = true;
            } else {
                comment.upvoted = false;
            }

            if(comment.author === username) {
                comment.owner = true;
            } else {
                comment.owner = false;
            }
            comment.pretty_date = util.timeDifference(currDate, new Date(comment.comment_id));
        }

        var data = {
            title: doc.title + ' | ',
            username: req.userCtx.name,
            login: !(req.userCtx.name),
            item: doc,
            owner: doc.author == username,
            comments: value.comments
        };

        var html = Mustache.to_html(this.templates.item, data, this.templates.partials);
        return html;
    });
}

ddoc.lists.user = function(head, req) {
    provides('html', function(){
        var Mustache = require('views/lib/mustache');

        var username = req.userCtx.name;
        var row = getRow();
        var value = row.value;

        var user = {};
        user.name = row.key;
        user.karma = value.totalPoints;

        var data = {
            title: user.name + ' | ',
            username: username,
            login: !(username),
            user: user,
            myprofile: user.name === username
        };

        var html = Mustache.to_html(this.templates.user, data, this.templates.partials);
        return html;
    });
}


ddoc.shows = {};
ddoc.shows.submit = function(doc, req) {
    var Mustache = require('views/lib/mustache');

    var data = {
        title: 'Submit | ',
        username: req.userCtx.name,
        login: !(req.userCtx.name)
    };

    var html = Mustache.to_html(this.templates.submit, data, this.templates.partials);
    return html;
}
ddoc.shows.login = function(doc, req) {
    var Mustache = require('views/lib/mustache');

    var data = {
        title: 'Login | ',
        username: req.userCtx.name,
        login: !(req.userCtx.name)
    };

    var html = Mustache.to_html(this.templates.login, data, this.templates.partials);
    return html;
}
ddoc.shows.about = function(doc, req) {
    var Mustache = require('views/lib/mustache');

    var data = {
        title: 'About | ',
        username: req.userCtx.name,
        login: !(req.userCtx.name)
    };

    var html = Mustache.to_html(this.templates.about, data, this.templates.partials);
    return html;
}

ddoc.updates = {};
ddoc.updates.item = function(doc, req) {
    var title = req.form.t;
    var url = req.form.u;

    if(!doc) {
        doc = {};
        doc._id = req.uuid;
        // http://stackoverflow.com/questions/4812235/whats-the-best-way-to-store-datetimes-timestamps-in-couchdb
        doc.created_at = JSON.parse(JSON.stringify(new Date));
        doc.author = req.userCtx.name;
        doc.voted = [doc.author];
    }

    doc.title = title;
    doc.url = url;
    doc.type = 'item';
    
    return [doc, {
        'headers' : {
            'Location' : '/'
        }
    }];
}

ddoc.updates.voteup = function(doc, req) {
    var username = req.userCtx.name;
    if(!doc.voted) doc.voted = [];
    doc.voted.push(username);
    return [doc, 'upvoted'];
}
ddoc.updates.commentvoteup = function(doc, req) {
    var username = req.userCtx.name;
    var comment_id = req.form.comment_id;

    // find this comment_id
    for(var i in doc.comments) {
        var comment = doc.comments[i];
        if(comment.comment_id === comment_id) {
            // found our comment, upvote!
            if(!comment.voted) comment.voted = [];
            comment.voted.push(username);
            break;
        }
    }

    return [doc, 'upvoted comment'];
}

ddoc.updates.comment = function(doc, req) {
    if(!doc.comments) doc.comments = [];
    var author = req.userCtx.name;
    var comment = {
        comment_id: JSON.parse(JSON.stringify(new Date)),
        parent_id: req.form.parent_id,
        text: req.form.text,
        voted: [author],
        author: author
    };

    doc.comments.push(comment);

    return [doc, 'commented'];
}

ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {
    function forbidden(message) {    
        throw({forbidden : message});
    };

    function unauthorized(message) {
        throw({unauthorized : message});
    };

    function require(field, message) {
        message = message || "Document must have a " + field;
        if (!newDoc[field]) forbidden(message);
    };

    function unchanged(field) {
        require(field);
        if (oldDoc && toJSON(oldDoc[field]) != toJSON(newDoc[field]))
            throw({forbidden : "Field can't be changed: " + field});
    }

    var username = userCtx.name;
    if(!username || typeof username != "string" || username.length<1){
        unauthorized("Must be logged on");
    }

    unchanged("type");

    if (newDoc.author) {
        if(newDoc.author != username){
            // we're editing another's document probably to upvote
            // be sure nothing else is changed
            if(newDoc.type == 'item') {
                unchanged("created_at");
                unchanged("author");
                unchanged("title");
                unchanged("url");
            } else if(newDoc.type == 'comment') {
                unchanged("created_at");
                unchanged("author");
                unchanged("thead_id");
                unchanged("parent_id");
                unchanged("text");
            }
          //unauthorized("You may only update documents with author " + username);
        }
    }  

    function diffArrays (A, B) {
        var strA = ":" + A.join("::") + ":";
        var strB = ":" +  B.join(":|:") + ":";
        var reg = new RegExp("(" + strB + ")","gi");
        var strDiff = strA.replace(reg,"").replace(/^:/,"").replace(/:$/,"");
        var arrDiff = strDiff.split("::");
        return arrDiff;
    }
    function isArray( obj ) {
        return toString.call(obj) === "[object Array]";
    }

    // TODO make sure other properties are of correct format as well.
    // for now we're checking voted which is the most important one
    // since it dictates the ranking algorithm
    if(newDoc.voted && !isArray(newDoc.voted)) {
        unauthorized("The voted property must be a JSON array!!");
    }

    if(oldDoc && newDoc.voted && oldDoc.voted) {
        if(newDoc.voted.length !== oldDoc.voted.length) {
            for(var i=0; i<oldDoc.voted.length; i++) {
                if(oldDoc.voted[i] === username) { 
                    unauthorized("you already upvoted this");
                } 
            }
        }
    }

    // check that it has changed - if it has, we only want one element to change and that must be the current user
    if(oldDoc && newDoc.voted && oldDoc.voted) {
        var diff = diffArrays(newDoc.voted, oldDoc.voted); 
        if(diff.length > 1) {
            unauthorized("You've added too many votes, hacker!");
        } else if(diff.length === 1) {
            // great someone added a vote! let's make sure it's them
            if(diff[0] !== username && diff[0] !== "") {
                unauthorized("You're adding a vote as someone else! CRACKER SMACKER");
            }
        }
    }
    
    if(newDoc.comments) {
        for(var i in newDoc.comments) {
            var comment = newDoc.comments[i];
            if(!comment.text) forbidden("Comment text is required");
        }
    }

    var type = newDoc.type;

    switch(type) {
        case "item": 
            unchanged("created_at");
            unchanged("author");
            require("title");
            require("url");
            break;
    }

    // make sure url is formatted correctly
    function isUrl(s) {
        return s.match(/(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi);
    }

    if(!isUrl(newDoc.url)) {
        forbidden("URL is formatted incorrectly");
    }
}

ddoc.views.lib = couchapp.loadFiles('./common');
ddoc.templates = couchapp.loadFiles('./templates');
couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

module.exports = ddoc;
