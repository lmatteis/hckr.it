var couchapp = require('couchapp')
  , path = require('path')
  ;

ddoc = 
  { _id:'_design/app'
  , rewrites : 
    [ {from:"/", to:'_list/items/items'}
    , {from:"/api", to:'../../'}
    , {from:"/api/*", to:'../../*'}
    , {from:"/*", to:'*'}
    ]
  }
  ;

ddoc.views = {
  items: {
    map: function(doc) {
      if(doc.type && doc.type === "item") {
        emit(doc.title, doc.points);
      }
    }
  }
};

ddoc.lists = {
  items: function(head, req) {
    provides("html", function(){
      var row;
      var Mustache = require("views/lib/mustache"),
          data = {
            title: "All Items",
            rows: []
          };
      while(row = getRow()) {
        data.rows.push(row);
      }
      var html = Mustache.to_html(this.templates.items, data, this.templates.partials);
      return html;
    });
  }
}

ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {   
  if (newDoc._deleted === true && userCtx.roles.indexOf('_admin') === -1) {
    throw "Only admin can delete documents on this database.";
  } 
}

ddoc.views.lib = couchapp.loadFiles('./common');
ddoc.templates = couchapp.loadFiles('./templates');
couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

module.exports = ddoc;
