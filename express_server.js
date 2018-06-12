const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const base62 = require("base62/lib/ascii");
const PORT = 8080;
app.set("view engine", "ejs");

function generateRandomString() {
  // ****************THIS FUNCTION IS TEMPORARY***********
  function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
  };
  return base62.encode(getRandomIntInclusive(100, 1000));
}


app.get("/urls", (req, res) => {
  let urlDatabase = {
    'TSLA': 'http://www.tesla.com/',
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
  };
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars)
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // debug statement to see POST parameters
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.listen(8080);
console.log('http//localhost:8080/');