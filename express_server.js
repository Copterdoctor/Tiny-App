var express = require("express");
var app = express();
var PORT = 8080;

app.set("view engine", "ejs");

app.get("/urls", (req, res) => {
  let urlDatabase = [
    {url: 'http://www.google.com/', something: 'TEXT'},
    {url: 'http://www.tesla.com/', something: 'TEXT'}
  ];
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars)
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id };
  res.render("urls_show", templateVars);
});

app.get('/new', (req, res) => {
  res.render('/urls_new.ejs');
});

app.listen(8080);
console.log('http//localhost:8080/');