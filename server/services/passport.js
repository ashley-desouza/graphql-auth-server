/*******************************************************************
  Import the passport.js module
********************************************************************/
const passport = require('passport');

/*******************************************************************
  Import the Local Strategy -
********************************************************************/
const LocalStrategy = require('passport-local').Strategy;

/*******************************************************************
 Import the mongoose module
********************************************************************/
const mongoose = require('mongoose');

/*******************************************************************
  Fetch the 'User' collection
********************************************************************/
const User = mongoose.model('user');

/*******************************************************************
  Authentication -
  Use passport.js serializeUser() method to serialize the User into
  a session cookie

  SerializeUser is used to provide some identifying token that can 
  be saved in the users session.

  We traditionally use the 'ID' for this.

  Reference - http://passportjs.org/docs/configure
********************************************************************/
passport.serializeUser((user, done) => {
  // Serialize the id coming from MongoDB
  done(null, user.id);
});

/*******************************************************************
  Authentication -
  Use passport.js deserializeUser() method to deserialize the
  session cookie and retrieve the user from the fetched id

  The counterpart of 'serializeUser'.
  Given only a user's ID, return the user object.
  This object is placed on 'req.user'.

  Reference - http://passportjs.org/docs/configure
********************************************************************/
passport.deserializeUser(async (id, done) => {
  const newUser = await User.findById(id);
  done(null, newUser);
});

/*******************************************************************
  Tell the base passport module that there is a new Strategy that
  we would like to use for User Authentication

  This is basically registering the Passport Local Strategy with
  passport

  We do this by defining a new instance of the Local Strategy,
  and defining some configuration settings

  This strategy is called whenever a user attempts to log in. 

  We first find the user model in MongoDB that matches the submitted
  email, then check to see if the provided password matches the
  saved password.

  There are two obvious failure points here: the email might not
  exist in our DB or the password might not match the saved one.

  In either case, we call the 'done' callback, including a string
  that messages why the authentication process failed.

  This string is provided back to the GraphQL client.

  1. Setup Options for the Local Strategy -
  usernameField - By default, passport will try to use the
   `username - password` combination to authenticate the User
   using the LocalStrategy. However, we want to use the
   `email-password` combination. Hence, we need to inform
   `LocalStrategy` of this.
********************************************************************/
const localOptions = { usernameField: 'email' };

// Create a Local Strategy
passport.use(
  new LocalStrategy(localOptions, (email, password, done) => {
    User.findOne({ email: email.toLowerCase() }, (err, user) => {
      if (err) {
        // If there was an Error in retrieving the User document,
        // call the `done` callback without a User Instance
        // if (err) { return done(err); }
        return done(err, false);
      }

      // Check if the User Id in the payload exists in our database
      if (!user) {
        // If it does not, call the `done` callback without a User
        // Instance
        return done(null, false, 'Invalid Credentials');
      }

      // If it does, call the `done` callback with that User Instance

      // compare passwords - Does the provided `password` match the hashed
      // `user.password` stored in our MongoDB
      user.comparePassword(password, (err, isMatch) => {
        if (err) {
          // If there was an Error
          // return done(err);
          return done(err, false);
        }

        if (isMatch) {
          // Password matched
          return done(null, user);
        }

        // If the password did not match
        return done(null, false, 'Invalid credentials.');
      });
    });
  })
);

/*******************************************************************
  Function to Create a new user account.

  We first check to see if a user already exists with this email
  address to avoid making multiple accounts with identical addresses.

  If it does not, we save the existing user.

  After the user is created, it is provided to the 'req.logIn'
  function. req.logIn is apart of Passport JS.
  Refer - http://www.passportjs.org/docs/login/

  The returned Promise is done because Passport only supports callbacks,
  while GraphQL only supports promises for async code
********************************************************************/
async function signup({ email, password, req }) {
  const user = new User({ email, password });

  if (!email || !password) {
    throw new Error('You must provide an email and password.');
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error('Email in use');
  }

  await user.save();

  return new Promise((resolve, reject) => {
    req.logIn(user, err => {
      if (err) {
        reject(err);
      }

      resolve(user);
    });
  });
}

/*******************************************************************
  Function to Log In a user.

  This will invoke the 'local-strategy' defined above in this file.

  The 'passport.authenticate' function returns a function,
  as its indended to be used as a middleware with Express.
********************************************************************/
function login({ email, password, req }) {
  return new Promise((resolve, reject) => {
    passport.authenticate('local', (err, user) => {
      if (!user) {
        reject('Invalid credentials.');
      }

      req.logIn(user, () => resolve(user));
    })({ body: { email, password } });
  });
}

module.exports = { signup, login };
