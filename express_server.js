const express = require("express");
const base62 = require("base62/lib/ascii");
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');


const app = express();
const PORT = 8080;
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';

app.use(morgan('tiny'));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['secretkey1'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));


app.set("view engine", "ejs");


const urlDatabase = {
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


function checkForExistingEmail(email) {
  for (const key in users) {
    if (users.hasOwnProperty(key)) {
      if (users[key].email === email)
        return true;
    }
  }
  return false;
}


// root redirects to urls
app.get('/', (req, res) => {
  let cookie = validCookie(req.session);
  if (cookie) {
    res.redirect(302, '/urls');
  } else {
    res.render('index');
  };
});


app.get('/login', (req, res) => {
  let cookie = validCookie(req.session);
  if (cookie) {
    res.redirect(302, '/urls');
  } else {
    res.render('login');
  };
});


app.post('/login', (req, res) => {
  let validEntries = validateData(req.body);
  let userExists = validateUser(req.body);
  let templateVars = {
    email: req.body.email,
    password: req.body.password,
  };

  if (validEntries && userExists) {
    let validPassword = checkPassword(req.body.password, userExists)
    if (validPassword) {
      req.session.user_id = userExists.id;
      res.redirect(302, '/urls');
    } else {
      res.redirect(302, 'login');
    };
  } else {
    res.render('login', templateVars);
  };
});


app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect(302, '/');
});


app.post('/register', (req, res) => {
  let currentUserBool = checkForExistingEmail(req.body.email);
  if (currentUserBool === false) {
    let randomUserId = generateRandomString();
    users[randomUserId] = { 'id': randomUserId, 'email': req.body.email };
    users[randomUserId].password = hashPassword(req.body.password, users[randomUserId]);
    req.session.user_id = randomUserId;
    res.redirect('/urls');
  } else {
    res.render('register', { err: "An account has already been created for that email" });
  }
});


app.get('/register', (req, res) => {
  res.render('register');
});


app.get("/urls", (req, res) => {
  let cookie = validCookie(req.session);
  if (cookie) {
    let templateVars = {
      urls: userUrls(req.session.user_id),
      email: users[req.session.user_id].email,
      rowNum: 1
    }
    res.render("urls_index", templateVars)
  } else {
    res.redirect(302, '/error');
  };
});


// Append long webaddress to urlDatabase with randomly generated short URL
app.post("/urls", (req, res) => {
  let randomString = generateRandomString();
  urlDatabase[randomString] = {
    longUrl: req.body.longUrl,
    user_id: req.session.user_id
  };
  res.redirect(302, `/urls`);
});


// Render enter new URL page
app.get('/urls/new', (req, res) => {
  let cookie = validCookie(req.session);
  if (cookie) {
    let templateVars = {
      email: users[req.session.user_id].email
    }
    res.render('urls_new', templateVars);
  } else {
    res.redirect(302, '/');
  };
});


// Render urls_show
app.get("/urls/:id", (req, res) => {
  let cookie = validCookie(req.session);
  if (cookie) {
    let templateVars = {
      shortUrl: req.params.id,
      email: users[req.session.user_id].email
    }
    res.render("urls_show", templateVars);
  } else {
    res.redirect(302, '/');
  };
});


// Delete a url from database
app.post('/u/:shortUrl/delete', (req, res) => {
  delete urlDatabase[req.params.shortUrl];
  res.redirect(302, '/urls');
});


// change long URL of database key
app.post('/u/:shortUrl/edit', (req, res) => {
  if (urlDatabase[req.params.shortUrl].user_id == req.session.user_id) {
    urlDatabase[req.params.shortUrl].longUrl = req.body.longUrl;
    res.redirect(302, '/urls');
  } else {
    let templateVars = {
      shortUrl: req.params.id,
      email: users[req.session.user_id].email,
      url: req.body.longUrl
    }
    res.render('/u/:shortURL/edit', templateVars);
  };

});


// Redirect to full url when shorturl entered /u/<shorturl>
app.get("/u/:shortUrl", (req, res) => {
  let longUrl = urlDatabase[req.params.shortUrl].longUrl;
  res.redirect(302, `${longUrl}`);
});


app.get('/error', (req, res) => {
  res.render('error');
});


app.listen(8080);
console.log('Listening on http//localhost:8080/');