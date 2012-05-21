var couchapp = require('couchapp'), 
    path = require('path');

ddoc = { 
    _id:'_design/news',
    rewrites : [
        {from:'/', to:'_list/all/all', query: { descending: "true" } },
        {from:'/item', to:'_list/item/item', query: { key: ":id" } },
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

            emit(doc._id, {
                doc: doc,
                domain: util.getDomain(doc.url),
                points: points,
                numcomments: numcomments
            });
        }
    }
};

ddoc.lists = {};
ddoc.lists.all = function(head, req) {
    provides('html', function(){
        var row,
            Mustache = require('views/lib/mustache');

        var data = {
            title: 'All Items',
            username: req.userCtx.name,
            login: !(req.userCtx.name),
            rows: []
        };

        var counter = 0;
        while(row = getRow()) {
            var doc = row.value.doc;
            doc.domain = row.value.domain;
            doc.points = row.value.points;
            doc.numcomments = row.value.numcomments;

            doc.counter = ++counter;

            data.rows.push(doc);
        }
        var html = Mustache.to_html(this.templates.all, data, this.templates.partials);
        return html;
    });
};

ddoc.lists.item = function(head, req) {
    provides('html', function(){
        var Mustache = require('views/lib/mustache');

        var value = getRow()['value'];
        
        var doc = value.doc;
        doc.domain = value.domain;
        doc.points = value.points;
        doc.numcomments = value.numcomments;

        var data = {
            title: 'Item',
            username: req.userCtx.name,
            login: !(req.userCtx.name),
            item: doc,
            comments: doc.comments
        };

        var html = Mustache.to_html(this.templates.item, data, this.templates.partials);
        return html;
    });
}


ddoc.shows = {};
ddoc.shows.submit = function(doc, req) {
    var Mustache = require('views/lib/mustache');

    var data = {
        title: 'Submit',
        username: req.userCtx.name,
        login: !(req.userCtx.name)
    };

    var html = Mustache.to_html(this.templates.submit, data, this.templates.partials);
    return html;
}
ddoc.shows.login = function(doc, req) {
    var Mustache = require('views/lib/mustache');

    var data = {
        title: 'Login',
        username: req.userCtx.name,
        login: !(req.userCtx.name)
    };

    var html = Mustache.to_html(this.templates.login, data, this.templates.partials);
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
    // push it only if it doesn't exist
    var exists = false;
    var message = '';
    for(var i=0; i<doc.voted.length; i++) {
        if(doc.voted[i] === username) { 
            exists = true;
            message = "you already upvoted this";
        } 
    }
    if(!exists) { 
        doc.voted.push(username);
        message = 'upvoted!';
    }
    return [doc, message];
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

    // check that it has changed - if it has, we only want one element to change and that must be the current user
    if(newDoc.voted && oldDoc.voted) {
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
    var type = newDoc.type;

    switch(type) {
        case "item": 
            unchanged("created_at");
            unchanged("author");
            require("title");
            require("url");
            break;
        case "comment": 
            unchanged("created_at");
            unchanged("author");
            unchanged("thead_id");
            unchanged("parent_id");
            require("text");
            break;
    }
}

ddoc.views.lib = couchapp.loadFiles('./common');
ddoc.templates = couchapp.loadFiles('./templates');
couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

module.exports = ddoc;
