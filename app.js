var couchapp = require('couchapp'), 
    path = require('path');

ddoc = { 
    _id:'_design/news',
    rewrites : [
        {from:'/', to:'_list/all/items'},
        {from:'/item', to:'_list/item/item', query: { startkey: [":id"], endkey: [":id",{}] } },
        {from:'/login', to:'login.html'},
        {from:'/submit', to:'submit.html'},
        {from:'/*', to:'*'}
    ]
};

ddoc.views = {};

ddoc.views.items = {
    map: function(doc) {
        if(doc.type === 'item') {
            emit(doc.points, doc);
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

        var data = {
            title: 'All Items',
            username: req.userCtx.name,
            login: !(req.userCtx.name),
            rows: []
        };

        while(row = getRow()) {
            data.rows.push(row.value);
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

ddoc.updates = {};

ddoc.updates.item = function(doc, req) {
    var title = req.form.title;
    var url = req.form.url;
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
