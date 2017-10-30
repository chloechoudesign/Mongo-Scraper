// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Scraping tools
var cheerio = require("cheerio");
var request = require("request");

// Require all models
var db = require("./models");

// Initialize Express
var PORT = 3000;
var app = express();

// Configure middleware
// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: false }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect("mongodb://localhost/scraper", {
  useMongoClient: true
});

// Routes
app.get("/", function(req, res) {
  res.send(index.html);
});

// A GET route for scraping the invision blog
app.get("/scrape", function(req, res) {
  
  request("https://www.invisionapp.com/blog", function(error, response, html) {
    
    var $ = cheerio.load(html);

    $(".title-link").each(function(i, element) {

      var result = {};

      result.title = $(element).children().text();
      result.link = $(element).attr("href");
      result.snippet = $(element).siblings('p').text().trim();

      console.log(result);
      
      db.Article
        .create(result)
        .then(function(dbArticle) {
          res.json(dbArticle);
        })
        .catch(function(err) {
          res.json(err);
        });
    });
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  
  db.Article
    .find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {

  db.Article
    .findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {

  db.Note
    .create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for saving/updating article to be saved
app.put("/saved/:id", function(req, res) {

  db.Article
    .findByIdAndUpdate({ _id: req.params.id }, { $set: { isSaved: true }})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for getting saved article
app.get("/saved", function(req, res) {

  db.Article
    .find({ isSaved: true })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for deleting/updating saved article
app.put("/delete/:id", function(req, res) {

  db.Article
    .findByIdAndUpdate({ _id: req.params.id }, { $set: { isSaved: false }})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});




// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
