const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Datastore = require('@google-cloud/datastore');

const config = require('./config');


const datastore = new Datastore({
    projectId: config.projectId
});

const router = express.Router();

const createToken = (id, name) => {
    return jwt.sign({
        id: parseInt(id),
        name
    }, config.authSecret);
};

// POST /auth endpoint. Looks up user in database and verifies password
//  Returns JWT if successful.
router.post('/', (req, res) => {
    if (!req.body.email) { // Discard requests without a submitted email
        res.status(400); // Bad request
        res.json({ success: false });
        return;
    }

    const email = req.body.email.toLowerCase();

    // Search for user by email
    const query = datastore.createQuery('user').filter('email', email);
    datastore.runQuery(query).then(data => {
        const results = data[0];
        if (results.length === 0) { // No user with that email found
            res.status(401); // Authentication required
            res.json({ success: false });
            return;
        }

        const user = results[0];

        // Compare submitted password to hash in database
        bcrypt.compare(req.body.password, user.pass).then(valid => {
            if (valid) {
                // Return JWT with user's ID/name
                
                const token = createToken(user[datastore.KEY].id, user.name);
                res.json({
                    success: true,
                    token
                });
            } else { // Invalid password
                res.status(401); // Authentication required
                res.json({ success: false });
            }
        });
    }).catch(e => {
        console.error(e);
        res.status(500);
        res.json({ success: false });
    });
    
});

router.post('/create', (req, res) => {
    if (!req.body.email || !req.body.name || !req.body.password) {
        // Discard requests missing components
        res.status(400); // Bad Request
        res.json({ success: false });
        return;
    }

    const email = req.body.email.toLowerCase();

    const query = datastore.createQuery('user').filter('email', email);
    datastore.runQuery(query).then(data => {
        // See if user exists with this email
        const results = data[0];
        if (results.length === 0) { // No user with that email found (good)

            // Generate a password hash for the new user
            bcrypt.hash(req.body.password, 10).then(hash => {
                const key = datastore.key(['user']);
                const entity = {
                    key,
                    data: {
                        name: req.body.name,
                        email: email,
                        pass: hash
                    }
                };

                // Save user details to database
                datastore.save(entity).then(() => {

                    // Create sign-in token and return success
                    const token = createToken(key.id, req.body.name);
                    res.status(201);
                    res.json({
                        success: true,
                        token
                    });
                });
            });
        } else {
            res.status(409); // Conflict (email already in use)
            res.json({ success: false });
            return;
        }
    }).catch(e => {
        console.error(e);
        res.status(500);
        res.json({ success: false });
    });
});

module.exports = router;