const passport = require('passport');

// Authentication middleware. Checks to see if JWT is valid, then appends user to request object
const authentication = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (user) {
            req.user = user;
            return next(err);
        } else {
            res.status(401);
            res.json();
        }
    })(req, res, next);
};

module.exports = authentication;