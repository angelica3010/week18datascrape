var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');

app.use(logger('dev'));
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(express.static('views'));



//Database configuration
mongoose.connect('mongodb://localhost/mongoosehwscraper');
var db = mongoose.connection;

db.on('error', function (err) {
console.log('Mongoose Error: ', err);
});
db.once('open', function () {
console.log('Mongoose connection successful.');
});

//Require Schemas
var Note = require('./models/Note.js');
var Article = require('./models/Article.js');


// Routes
app.get('/', function(req, res) {
  res.send(index.html);
});


app.get('/scrape', function(req, res) {
  request('http://www.echojs.com/', function(error, response, html) {
    var $ = cheerio.load(html);
    $('article h2').each(function(i, element) {

				var result = {};

				result.title = $(this).children('a').text();
				result.link = $(this).children('a').attr('href');

				var entry = new Article (result);

				entry.save(function(err, doc) {
				  if (err) {
				    console.log(err);
				  } else {
				    console.log(doc);
				  }
				});


    });
  });
  res.send("Scrape Complete");
});


app.get('/articles', function(req, res){
	Article.find({}, function(err, doc){
		if (err){
			console.log(err);
		} else {
			res.json(doc);
		}
	});
});


app.get('/articles/:id', function(req, res){
	Article.findOne({'_id': req.params.id})
	.populate('note')
	.exec(function(err, doc){
		if (err){
			console.log(err);
		} else {
			res.json(doc);
		}
	});
});

// Find All Notes (including null notes)

// db.records.find( { note: { $exists: true } } )
app.get('/showallnotes/', function(req, res){
	//$and: 
	//db.inventory.find( { $and: [ { price: { $ne: 1.99 } }, { price: { $exists: true } } ] } )

// db.inventory.find( { price: { $ne: 1.99, $exists: true } } )


	// db.inventory.find( {
 //    $and : [
 //        { $or : [ { price : 0.99 }, { price : 1.99 } ] },
 //        { $or : [ { sale : true }, { qty : { $lt : 20 } } ] }
 //    ]
// } )
// 
// find({"IMAGE URL":{$ne:null}});
	// Article.find( {note: { $ne: null },  note: { $exists: true }})
Article.find({"note": {$ne: null}})

	.populate('note')
	.exec(function(err, doc){
		if (err){
			console.log(err);
		} else {
			res.json(doc);
		}
	});
});


app.post('/articles/:id', function(req, res){
	var newNote = new Note(req.body);

	newNote.save(function(err, doc){
		if(err){
			console.log(err);
		} else {
			Article.findOneAndUpdate({'_id': req.params.id}, {'note':doc._id})
			.exec(function(err, doc){
				if (err){
					console.log(err);
				} else {
					res.send(doc);
				}
			});

		}
	});
});


//Route to see notes we have added
app.get('/note', function(req, res) {
  Note.find({}, function(err, doc) {
    if (err) {
      res.send(err);
    } else {
      res.send(doc);
    }
  });
});


//New Note Creation
app.post('/submit', function(req, res) {

  var newNote = new Note(req.body);

  //Save the new note
  newNote.save(function(err, doc) {
    if (err) {
      res.send(err);
    } else {

// Will this work with the article in the notes section?
      Article.findOneAndUpdate({}, {$push: {'notes': doc._id}}, {new: true}, function(err, doc) {
        if (err) {
          res.send(err);
        } else {
          res.send(doc);
        }
      });

    }
  });

});

//Route to see what user looks like WITH populating (Populate Notes here??)
app.get('/populatednotes', function(req, res) {
  Article.find({})
    .populate('notes')
    .exec(function(err, doc) {
      if (err) {
        res.send(err);
      } else {
        res.send(doc);
      }
    });
});


// Make the delete route. Remember (Get, Post, Put, and Delete) for routes. For client side, JQuery docs
// say put and delete are not supported by all browsers, so we use the post method here

// This is how the data looks like out of Mongo for the Articles collection
// > db.articles.find()
// { "_id" : ObjectId("575b2518c058c25dabc3e3c1"), "title" : "jQuery 3.0 Final Released!", "link" : "http://blog.jquery.com/2016/06/09/jquery-3-0-final-released/", "__v" : 0 }
// mongojs npm package is here https://www.npmjs.com/package/mongojs

app.post('/delete/:id', function(req, res) {
	// var database = "mongoosehwscraper";
	// var collections = ["notes"];
	// var dbs = mongoose(database, collections);
	// dbs.on('error', function(err) {
	//   console.log('Database Error:', err);
	// });
	// var ObjectId = mongoose.ObjectId;
	// console.log({"_id": ObjectId(req.params.id)})
	  Article.findOneAndUpdate({_id:req.params.id}, {'notes':''}, {new: true}, function(err, doc) {
        if (err) {
          res.send(err);
        } else {
        	console.log('Bye Felicia')
          res.send(doc);
        }
      });
});



// Deleting All the Notes
app.post('/deletenotes', function(req, res) {
	Note.remove({}, function(err,stuff) {
		if (err) {
			console.log(err)
		} else {
			console.log(stuff)
		}
	});
});

app.listen(3006, function() {
  console.log('App running on port 3006!');

});
