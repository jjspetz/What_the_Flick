const express = require('express');
const app = express();
const Promise = require('bluebird');
const morgan = require('morgan');
const axios = require('axios');
const pgp = require('pg-promise')({
  promiseLib: Promise
});
const bodyParser = require('body-parser');
//dbConfig can be changed to whatever the database configuration file is named
var db = pgp({database: 'highscores'});

// import handlebars
app.set('view engine', 'hbs');

// global variables
var username, score, lives;
var img_url;
var title;

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/static', express.static('public'));

function Movies() {
  this.nextMovie;
  this.movies = []
  this.addMovie = function () {
    this.movies.push(this.nextMovie);
  console.log('Played Movies are ' + this.movies)
  }

  this.newMovie = function () {
    this.nextMovie = Math.ceil(Math.random() * 1000);
    for(var i = 0; i < this.movies.length;i++) {
      if (this.nextMovie === this.movies[i]) {
        console.log('Duplicate found ' + this.nextMovie)
        this.newMovie();
        return;
      }else if (this.movies.length > 10){
        //G A M E   O V E R
        return;
      }
    }
    this.nextMovie = this.nextMovie.toString();
    console.log('Added ' + this.nextMovie)
    this.addMovie();
    return this.nextMovie;
  }
}

var movies = new Movies();
movies.newMovie();

//set url parts as variables to be concatenated
var base_url = 'https://api.themoviedb.org/3/movie/';

var api_key = 'api_key=' + process.env.API_KEY;
var film_id = movies.newMovie() + '?';

//axios request
axios.get(base_url + film_id + api_key)
    .then(function (response) {
        movieTitle = response.data.title;
        console.log(response.data);
        img_url = response.data.backdrop_path;
        title = response.data.title;
    })
    .catch(function (error) {
        console.error(error);
    });

// index.hbs should be renamed if different per paul or alston
//in response.render add context dictionary to pass img data to front end through hbs
app.get('/', function(request, response) {
    var context = {
        imgUrl: 'https://image.tmdb.org/t/p/w500/' + img_url,
        title: title
    }
  response.render('index.hbs', context);
});

//Login
//redirect is equal to the path of the page that redirected to the login screen
app.post('/login', function(request, response, next) {
  var redirect = request.query.redirect;
  username = request.query.username;
  response.redirect('index.hbs')
});

app.post('/new_High_Score', function(request, response, next) {
//maybe need a cookie from which to log the username for stretch goal
//var username =
  username = request.query.username
  score = request.query.score;
//high_scores should be whatever the table name is per jj
  db.query(`INSERT INTO highscores VALUES (default, ${username}, ${score})`)
    .then(function() {
//highscores.hbs should be whatever frontend hbs has the highscores per paul or alston
      response.redirect('/highscores');
    })
    .catch(next);
});

app.get('/highscores', function(request, response, next) {
  db.any("SELECT * FROM highscores ORDER BY score DESC LIMIT 10")
    .then(function(results) {
      response.render('highscores.hbs', {results:results});
    })
    .catch(next);
});


app.post('/guess', function(request, response, next) {
  var answer = request.body.answer.toLowerCase().replace(/\W/g, "");
  var title2 = title.toLowerCase().replace(/\W/g, "");
  console.log(answer);
  console.log(title2);
  if (answer === title) {
    score += 1;
  } else {
    lives -= 1;
    if (lives === 0) {
      response.redirect
    }
  }

});

//Port 3000 is optional
app.listen(3000, function() {
  console.log('Example app listening on port 3000!')
})