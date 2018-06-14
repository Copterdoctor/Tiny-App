const express = require("express");
const base62 = require("base62/lib/ascii");
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');


const app = express();
const PORT = 8080;
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';

app.use(morgan('tiny'));
app.use(cookieParser());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));


app.set("view engine", "ejs");


let urlDatabase = {
  'TSLA': 'http://www.tesla.com/',
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


const users = {
  'admin': {
    id: "admin",
    email: "admin@admin.com",
    password: "$2b$10$1VJtF2uZI2RHClWKAhwPyeQ8SfxRK3ztcgpz8yCfq68lyLMG/JNnC"
  }
};


function hashPassword(data) {
  return bcrypt.hashSync(data, saltRounds);
};

function checkPassword(password, user) {
  return bcrypt.compareSync(password, user.password);;
};


function generateRandomString() {
  // ****************THIS FUNCTION IS TEMPORARY***********
  function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
  };
  return base62.encode(getRandomIntInclusive(1000000, 10000000));
};


function validateData(data) {
  if (data.email && data.email.length > 0 && data.password && data.password.length > 0) {
    return true;
  };
  return false;
};


function validCookie(cookies) {
  for (let entry in users) {
    if (cookies.user_id == users[entry].id) {
      return true;
    };
  };
  return false;
};


function validateUser(data) {
  for (let userEntry in users) {
    if (users[userEntry].email == data.email) {
      return users[userEntry];
    };
  };
  return false;
};


// root redirects to urls
app.get('/', (req, res) => {
  res.redirect(302, '/login');
});


app.get('/login', (req, res) => {
  let cookie = validCookie(req.cookies);
  if (cookie) {
    res.redirect(302, '/urls');
  } else {
    res.render('login');
  };
});


app.post('/login', (req, res) => {
  let validEntries = validateData(req.body);
  let userExists = validateUser(req.body);
  if (validEntries && userExists) {
    let validPassword = checkPassword(req.body.password, userExists)
    if (validPassword) {
      res.cookie('user_id', userExists.id);
      res.redirect(302, '/urls');
    } else {
      res.render('login', { email: req.body.email, password: req.body.password });
    };
  } else {
    res.render('login', { email: req.body.email, password: req.body.password });
  };
});


app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect(302, '/login');
});


app.post('/register', (req, res) => {
  let randomUserId = generateRandomString();
  users[randomUserId] = { 'id': randomUserId, 'email': req.body.email };
  users[randomUserId].password =  hashPassword(req.body.password, users[randomUserId]);
  res.cookie('user_id', randomUserId);
  res.redirect('/urls');
});


app.get('/register', (req, res) => {
  res.render('register');
});


app.get("/urls", (req, res) => {
  let cookie = validCookie(req.cookies);
  console.log(users);
  
  if (cookie) {
    let templateVars = { urls: urlDatabase, };
    res.render("urls_index", templateVars)
  } else {
    res.redirect(302, '/login');
  };
});


// Append long webaddress to urlDatabase with randomly generated short URL
app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect(302, `/urls`);
});


// Render enter new URL page
app.get('/urls/new', (req, res) => {
  let cookie = validCookie(req.cookies);
  if (cookie) {
    res.render('urls_new');
  } else {
    res.redirect(302, '/login');
  };
});


// Render urls_show
app.get("/urls/:id", (req, res) => {
  let cookie = validCookie(req.cookies);
  if (cookie) {
    let templateVars = { shortURL: req.params.id };
    res.render("urls_show", templateVars);
  } else {
    res.redirect(302, '/login');
  };
});


// Delete a url from database
app.post('/u/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect(302, '/urls');
});


// change long URL of database key
app.post('/u/:shortURL/edit', (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect(200, '/urls');
});


// Redirect to full url when shorturl entered /u/<shorturl>
app.get("/u/:shortURL", (req, res) => {
  let cookie = validCookie(req.cookies);
  if (cookie) {
    let longURL = urlDatabase[req.params.shortURL];
    res.redirect(302, `${longURL}`);
  } else {
    res.redirect(302, '/login');
  };
});


app.listen(8080);
console.log('Listening on http//localhost:8080/');