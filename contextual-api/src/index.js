// Module Imports
const express = require('express');
const fileUpload = require('express-fileupload');
const passport = require('passport');
const cors = require('cors');

// Local Imports
const imagesRouter = require('./images');
const authRouter = require('./auth');
const uploadRouter = require('./upload');
const jwtStrategy = require('./passport/jwt');
const authentication = require('./middleware/authentication');

// Configure JWT authenticator
passport.use(jwtStrategy);

// Instantiate express app, provide middleware
const app = express();
app.use(express.json());
app.use(fileUpload());
app.use(passport.initialize());
app.use(cors());

// Instantiate main router, give middleware and subrouters
// Note: The "authentication" middleware verifies JWT and injects a "user" property
//       onto the req object (req.user). This can be used to get info about the
//       current active user, such as ID (req.user.id).
const router = express.Router();
router.get('/', (req, res) => {
    return res.send(`
        <h1>Contextual API</h1>
        <a href="https://contextual.winteriscompiling.uk/">https://contextual.winteriscompiling.uk/</a>
    `);
});
router.use('/auth', authRouter);
router.use('/images', authentication, imagesRouter);
router.use('/upload', authentication, uploadRouter);
app.use(router);

// Listen on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Contextual API listening on port ' + PORT + '!'));