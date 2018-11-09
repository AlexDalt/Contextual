const passport = require('passport');
const passportJwt = require('passport-jwt');
const Datastore = require('@google-cloud/datastore');

const config = require('../config');

// Create Cloud Datastore reference
const datastore = new Datastore({
    projectId: config.projectId
});

// Set up JWT configuration
const JwtStrategy = passportJwt.Strategy;
const ExtractJwt = passportJwt.ExtractJwt;
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('JWT'),
    secretOrKey: config.authSecret,
    // issuer: config.issuer,
    // algorithms: ['HS256']
};

// Authentication strategy for Passport.js library
// - Validates signature of a JWT sent through the "Authorization" header
// - Checks to see the user exists
const strategy = new JwtStrategy(jwtOptions, (payload, next) => {

    // Check user exists
    const imageQuery = datastore.get(datastore.key(['user', payload.id])).then(result => {
        if (result) {
            // Found user; assign ID to result and pass on
            result.id = payload.id;
            next(null, result);
        } else {
            // Couldn't find user; fail
            next(null, false);
        }
    }).catch(() => {
        // Error; pass on user as unauthenticated
        next(null, false);
    });

});

passport.use(strategy);

module.exports = strategy;