const express = require("express");
const base62 = require("base62/lib/ascii");
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080;
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

function generateRandomString() {
  // ****************THIS FUNCTION IS TEMPORARY***********
  function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
  };
  return base62.encode(getRandomIntInclusive(100, 1000));
}

let urlDatabase = {
  'TSLA': 'http://www.tesla.com/',
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars)
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  console.log(longURL);
  res.redirect(301, `${longURL}`);
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  // console.log(`app.post ${req.body.longURL}`);  // debug statement to see POST parameters
  urlDatabase[randomString] = req.body.longURL;
  res.redirect(302, `/u/${randomString}`);
});

app.listen(8080);
console.log('http//localhost:8080/');