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
  'TSLA': {
    longUrl: 'http://www.tesla.com/',
    user_id: 'admin'
  },
  "b2xVn2": {
    longUrl: "http://www.lighthouselabs.ca",
    user_id: 'admin'
  },
  "9sm5xK": {
    longUrl: "http://www.google.com",
    user_id: 'admin'
  }
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


function userUrls(user_id) {
  const output = {};
  for (const url in urlDatabase) {
    if (urlDatabase.hasOwnProperty(url)) {
      if (urlDatabase[url].user_id === user_id) {
        output[url] = urlDatabase[url]
      };
    };
  };
  return output;
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
  users[randomUserId].password = hashPassword(req.body.password, users[randomUserId]);
  res.cookie('user_id', randomUserId);
  res.redirect('/urls');
});


app.get('/register', (req, res) => {
  res.render('register');
});


app.get("/urls", (req, res) => {
  let cookie = validCookie(req.cookies);
  if (cookie) {
    console.log(req.cookies.user_id);

    let urls = userUrls(req.cookies.user_id);
    res.render("urls_index", { urls: urls })
  } else {
    res.redirect(302, '/login');
  };
});


// Append long webaddress to urlDatabase with randomly generated short URL
app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  urlDatabase[randomString] = {
    longUrl: req.body.longUrl,
    user_id: req.cookies.user_id
  };
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
    let templateVars = { shortUrl: req.params.id };
    res.render("urls_show", templateVars);
  } else {
    res.redirect(302, '/login');
  };
});


// Delete a url from database
app.post('/u/:shortUrl/delete', (req, res) => {
  delete urlDatabase[req.params.shortUrl];
  res.redirect(302, '/urls');
});


// change long URL of database key
app.post('/u/:shortUrl/edit', (req, res) => {
  if (urlDatabase[req.params.shortUrl].user_id == req.cookies.user_id) {
    urlDatabase[req.params.shortUrl].longUrl = req.body.longUrl;
    res.redirect(302, '/urls');
  } else {
    res.render('/u/:shortURL/edit', { url: req.body.longUrl });
  };

});


// Redirect to full url when shorturl entered /u/<shorturl>
app.get("/u/:shortUrl", (req, res) => {
  let cookie = validCookie(req.cookies);
  if (cookie) {
    let longUrl = urlDatabase[req.params.shortUrl];
    res.redirect(302, `${longUrl}`);
  } else {
    res.redirect(302, '/login');
  };
});


app.listen(8080);
console.log('Listening on http//localhost:8080/');