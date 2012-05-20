var couchapp = require('couchapp'), 
    path = require('path');

ddoc = { 
    _id:'_design/news',
    rewrites : [
        {from:'/', to:'_list/all/items'},
        {from:'/item', to:'_list/item/items', query: { startkey: [":id"], endkey: [":id",{}] } },
        {from:'/login', to:'login.html'},
        {from:'/api', to:'../../'},
        {from:'/api/*', to:'../../*'},
        {from:'/*', to:'*'}
    ]
};

ddoc.views = {};

ddoc.views.items = {
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
            data.rows.push(row);
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

ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {   
  if (newDoc._deleted === true && userCtx.roles.indexOf('_admin') === -1) {
    throw 'Only admin can delete documents on this database.';
  } 
}

ddoc.views.lib = couchapp.loadFiles('./common');
ddoc.templates = couchapp.loadFiles('./templates');
couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

module.exports = ddoc;
