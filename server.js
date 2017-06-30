 /******************************************************
 * PLEASE DO NOT EDIT THIS FILE
 * the verification process may break
 * ***************************************************/

'use strict';

var fs = require('fs');
var mongo = require('mongodb').MongoClient;
var express = require('express');
var app = express();

function random_string(length) {
  var res = "";
  var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (var i = 0; i < length; ++i) {
    res += chars[~~(Math.random() * chars.length)];
  }
  return res;
}

if (!process.env.DISABLE_XORIGIN) {
  app.use(function(req, res, next) {
    var allowedOrigins = ['https://narrow-plane.gomix.me', 'https://www.freecodecamp.com'];
    var origin = req.headers.origin || '*';
    if(!process.env.XORIG_RESTRICT || allowedOrigins.indexOf(origin) > -1){
         console.log(origin);
         res.setHeader('Access-Control-Allow-Origin', origin);
         res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    }
    next();
  });
}

app.use('/public', express.static(process.cwd() + '/public'));

app.route('/_api/package.json')
  .get(function(req, res, next) {
    console.log('requested');
    fs.readFile(__dirname + '/package.json', function(err, data) {
      if(err) return next(err);
      res.type('txt').send(data.toString());
    });
  });
  
app.route('/')
    .get(function(req, res) {
		  res.sendFile(process.cwd() + '/views/index.html');
    })

app.get('/new/:url*', function(req, res) {
  var url = req.params.url;
  console.log(url);
  var shortened = random_string(6);
  mongo.connect(process.env.DATABASE_URI, function(err, db) {
    if (err) throw err;
    db.collection('urls').insert({
      original_url: url,
      shortened_url: shortened
    }, function (err, data) {
      if (err) throw err;
      console.log(data);
      res.json({
        original_url: url,
        shortened_url: shortened
      })
      db.close();
    })
  });
});

app.get('/:url', function(req, res) {
  var shortened = req.params.url;
  mongo.connect(process.env.DATABASE_URI, function(err, db) {
    if (err) throw err;
    db.collection('urls').find({
      shortened_url: shortened
    }).foreach(function(data) {
      res.redirect(data.original_url);
      return;
    });
    db.close();
    res.json({
      error: "This url is not in the database"
    })
  });
});

// Respond not found to all the wrong routes
app.use(function(req, res, next){
  res.status(404);
  res.type('txt').send('Not found');
});

// Error Middleware
app.use(function(err, req, res, next) {
  if(err) {
    res.status(err.status || 500)
      .type('txt')
      .send(err.message || 'SERVER ERROR');
  }  
})

app.listen(process.env.PORT, function () {
  console.log('Node.js listening ...');
});

