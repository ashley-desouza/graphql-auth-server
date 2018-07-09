// Import the bcrypt module
const bcrypt = require('bcrypt');

// Import the mongoose module
const mongoose = require('mongoose');

// Import the 'Schema' property from the mongoose module
const { Schema } = mongoose;

// Declare the User Mongoose Schema
const UserSchema = new Schema({
  email: String,
  password: String,
  githubId: String
});

/********************************************************************
  The user's password is never saved in plain text.

  Prior to saving the user model, we 'salt' and 'hash' 
  the users password.

  This is a one way procedure that modifies the password - 
  the plain text password cannot be derived from
  the salted + hashed version. 

  See 'comparePassword' to understand how this is used.

  On Save hook, encrypt password.
  Before saving a model, this function will be executed
********************************************************************/
UserSchema.pre('save', function save(next) {
  // Get access to the instance of the User model
  const user = this;

  const saltRounds = 10;

  if (!user.isModified('password')) {
    return next();
  }
  // Generate a salt, then run the callback function
  // Refer - https://www.npmjs.com/package/bcrypt#usage
  bcrypt.genSalt(saltRounds, (err, salt) => {
    if (err) {
      return next(err);
    }

    // Hash (Excrypt) the user password using the salt
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }

      // Overwrite plaintext password with hashes (encrypted) password
      user.password = hash;

      // Go ahead and save the user instance into the DB
      next();
    });
  });
});

/********************************************************************
  We need to compare the plain text password 
  (submitted whenever logging in) with the salted + hashed version
  that is sitting in the database.

  'bcrypt.compare' takes the plain text password and hashes it, 
  then compares that hashed password to the one stored in the DB.

  Remember that hashing is a one way process - 
  the passwords are never compared in plain text form.

  This method WILL BE ADDED to every User model Instance
********************************************************************/
UserSchema.methods.comparePassword = function comparePassword(
  candidatePassword,
  callback
) {
  // Use bcrypt's `compare` method to compare the passwords
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    if (err) {
      // If there was an Error
      return callback(err);
    }

    callback(null, isMatch);
  });
};

// Create a model class -> 'user' collection
mongoose.model('user', UserSchema);
