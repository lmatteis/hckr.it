To install you need latest `node.js` and `npm`.

First clone this repo.

Then install the `couchapp` dependency with `npm`:
  
    npm install couchapp

And then simply push this source code to your couchdb instance:

    couchapp push app.js http://yourcouch.com/dbname

# Beware! I was drinking lots of coffee when I wrote this

This is basically a Hacker News clone for CouchDB. As a Couchapp. 
I figured it would be awesome to have a Couchapp act as an entire news application such as HN.
This would enable anyone to easily host their own HN site, with their own topic.

## A couple of design decisions

* Each `item` and all its `comments` are stored inside a single document. Why? Fuck it, that's why!
* Here's what an `item` looks like:
`
    {
       "_id": "784289f1ac926d7d9ab85b3a22005546",
       "_rev": "5-7d72e6583ddd567d700a242618c3ce6f",
       "created_at": "2012-05-20T21:09:52.045Z",
       "author": "test",
       "title": "Nottingam",
       "url": "http://dfsf.com",
       "type": "item",
       "voted": [ 
           "test"
       ],
       "comments": [
           {
               "comment_id": "2012-05-21T07:43:01.410Z",
               "parent_id": 0,
               "text": "Ciao Bella",
               "voted": [
               ],
               "author": "test"
           },
           {
               "comment_id": "2012-05-21T07:48:50.963Z",
               "parent_id": "2012-05-21T07:43:01.410Z",
               "text": "My born super",
               "voted": [
               ],
               "author": "test"
           }
       ]
    } 
`
