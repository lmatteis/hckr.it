var couchapp = require('couchapp'), 
    path = require('path');

ddoc = { 
    _id:'_design/news',
    rewrites : [
        {from:'/', to:'_list/items/items'},
        {from:'/login', to:'login.html'},
        {from:'/api', to:'../../'},
        {from:'/api/*', to:'../../*'},
        {from:'/*', to:'*'}
    ]
};

ddoc.views = {};

ddoc.views.items = {
    map: function(doc) {
        if(doc.path && doc.points) {
            // doc.path should always be an array
            var keys = [];
            for(var i=0; i<doc.path.length; i++) {
                keys.push(doc.path[i]);
            }
            // add its own id as shown here http://probablyprogramming.com/2008/07/04/storing-hierarchical-data-in-couchdb
            keys.push(doc._id);

            keys.push(doc.points);

            emit(keys, doc.points);
        }
    }
};

ddoc.lists = {};
ddoc.lists.items = function(head, req) {
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
        var html = Mustache.to_html(this.templates.items, data, this.templates.partials);
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
