var couchapp = require('couchapp'), 
    path = require('path');

ddoc = { 
    _id:'_design/news',
    rewrites : [
        {from:'/', to:'_list/all/items', query: { descending: "true" } },
        {from:'/item', to:'_list/item/item', query: { startkey: [":id"], endkey: [":id",{}] } },
        {from:'/login', to:'_show/login'},
        {from:'/submit', to:'_show/submit'},
        {from:'/r', to:'_update/item'},
        {from:'/*', to:'*'}
    ]
};

ddoc.views = {};
ddoc.views.items = {
    map: function(doc) {
        if(doc.type === 'item') {
            var ranking = require('views/lib/ranking');

            var points = ranking.getPoints(doc.voted);
            var score = ranking.findScore(points, doc.created_at);

            emit(score, doc);
        }
    }
};

ddoc.views.item = {
    map: function(doc) {
        if(doc.type === 'item') {
            emit([doc._id, 0], doc);
        } else if (doc.type === 'comment') {
            emit([doc.thread_id, 1], doc);
        }
    }
};


ddoc.lists = {};
ddoc.lists.all = function(head, req) {
    provides('html', function(){
        var row,
            Mustache = require('views/lib/mustache');
        var ranking = require('views/lib/ranking');

        var data = {
            title: 'All Items',
            username: req.userCtx.name,
            login: !(req.userCtx.name),
            rows: []
        };

        while(row = getRow()) {
            var value = row.value;
            value.points = ranking.getPoints(value.voted);
            data.rows.push(value);
        }
        var html = Mustache.to_html(this.templates.all, data, this.templates.partials);
        return html;
    });
};

ddoc.lists.item = function(head, req) {
    provides('html', function(){
        var row,
            Mustache = require('views/lib/mustache');

        var data = {
            title: 'Item',
            username: req.userCtx.name,
            login: !(req.userCtx.name),
            item: getRow()['value'], 
            rows: []
        };

        while(row = getRow()) {
            data.rows.push(row.value);
        }
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

    if (newDoc.author) {
        if(newDoc.author != username){
          unauthorized("You may only update documents with author " + username);
        }
    }  
    unchanged("type");

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
