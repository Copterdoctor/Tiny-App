const express = require("express");
const base62 = require("base62/lib/ascii");
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080;
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

function generateRandomString() {
  // ****************THIS FUNCTION IS TEMPORARY***********
  function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
  };
  return base62.encode(getRandomIntInclusive(10000, 100000));
}

let urlDatabase = {
  'TSLA': 'http://www.tesla.com/',
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
// Redirect to full url when shorturl entered /u/<shorturl>
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(302, `${longURL}`);
});

app.post('/u/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect(301, '/urls');
});

// Render index of urls in urlDatabse object
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars)
});
// Append long webaddress to urlDatabase with randomly generated short URL
app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect(302, `/urls`);
});
// Render enter new URL page
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});
// Render urls_show
app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id };
  res.render("urls_show", templateVars);
});

app.listen(8080);
console.log('http//localhost:8080/');