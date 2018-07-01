const express = require('express');
const session = require('express-session');
const expressGraphQL = require('express-graphql');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const mongoose = require('mongoose');
const keys = require('./config/keys');

/*******************************************************************
 Require in the 'User' and 'Survey' collections, so that they can
 be created in the database at run time.

 IMP - Import this before the passport Middleware as well as the 
 GraphQL instance, because we will try to retrieve the 'User'
 collection in the passport file, and in order to do that it
 should already have been registered
********************************************************************/
require('./models');
const schema = require('./schema/schema');

/*******************************************************************
 Require the customized 'passport' Middleware
 MUST come after the User model is initialized
********************************************************************/
require('./services/passport');

// Mongoose's built in promise library is deprecated, replace it with
// ES2015 Promise
mongoose.Promise = global.Promise;

/*******************************************************************
 Connect to the mlab MongoDB database

 Log a message on success or failure
********************************************************************/
mongoose.connect(keys.mongoURI);

mongoose.connection
  .once('open', () => console.log('Connected to MongoLab instance.'))
  .on('error', error => console.log('Error connecting to MongoLab:', error));

/*******************************************************************
Create an Express App
********************************************************************/
const app = express();

/*******************************************************************
 Tell the Express Application to use the MongoStore for session
 management.

 MongoStore configures express to use sessions.

 This places an encrypted identifier on the users cookie.

 When a user makes a request, this middleware examines the cookie
 and modifies the request object to indicate which user
 made the request.

 The cookie itself only contains the id of a session;
 more data about the session is stored inside of MongoDB.

 Refer - https://www.npmjs.com/package/express-session
 for all settings
********************************************************************/
app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: keys.expressSession,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000 // 1 day in milliseconds
    },
    store: new MongoStore({
      url: keys.mongoURI,
      autoReconnect: true
    })
  })
);

/*******************************************************************
 Middleware for using the 'passport' module to use the
 'cookie-session' module. In other words, tell 'passport' to use
 cookies to handle authentication.

 Passport is wired into express as a middleware. 

 When a request comes in, Passport will examine the request's session
 (as set by the above config) and assign the current user
 to the 'req.user' object.
 See also services/passport.js
********************************************************************/
app.use(passport.initialize());
app.use(passport.session());

/*******************************************************************
 Middleware that instructs Express to pass on any request 
 made to the '/graphql' route to the GraphQL instance.
********************************************************************/
app.use(
  '/graphql',
  expressGraphQL({
    schema,
    graphiql: true
  })
);

// Export the Express Application
module.exports = app;
