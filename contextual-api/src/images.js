const express = require('express');
const Storage = require('@google-cloud/storage');
const Datastore = require('@google-cloud/datastore');
const request = require('request');

const config = require('./config');
const authentication = require('./middleware/authentication');

// Create new Google Cloud Storage/Datastore references
const storage = new Storage({
    projectId: config.projectId
});
const bucket = storage.bucket(config.bucketName);
const datastore = new Datastore({
    projectId: config.projectId
});

const router = express.Router();

// Get all images belonging to a user
//  Returns a promise that resolves with an array of images
const getUserImages = (userId) => {
    const imageQuery = datastore.createQuery('image')
    .filter('user', userId)
    .order('date', { descending: true });

    return datastore.runQuery(imageQuery).then((data) => {
        // Found results; change format and output
        return data[0].map((result) => {
            const entry = result;
            const url = entry.url;
            entry.id = result[datastore.KEY].id;
            entry.url = config.bucketHost + url;
            entry.thumbnail = config.bucketHost + 'thumbnails/' + url;
            return entry;
        });
    });
};

/**
 * ENDPOINTS
 */

// GET /images endpoint. Returns all images belonging to the authenticated user
router.get('/', (req, res) => {

    getUserImages(req.user.id).then(results => {
        res.json(results);
    }).catch((e) => {
        console.log("Couldn't retrieve images");
        console.error(e);
        // Error retrieving images from datastore
        res.status(500);
        res.json({ success: false });
    });
});

// GET /images/search/{term} endpoint. Returns all user images matching a search term
router.get('/search/:term', (req, res) => {
    // Poll search API
    const url = config.searchAPI + req.user.id + '/' + req.params.term;
    // console.log('Polling search API at:', url);
    request.get(url, (err, response, body) => {
        if (err) {
            console.error("Search failed", err);
            return res.json({ success: false });
        } else if (response.statusCode != 200) {
            console.error("Search response failed", response.statusCode);
            return res.json({ success: false });
        }
        const searchResults = JSON.parse(body);

        // No results
        if (searchResults.length == 0) {
            return res.json([]);
        }

        // Get images
        getUserImages(req.user.id).then((images) => {
            search = req.params.term.trim().toLowerCase();
            if (!search) {
                return res.json(images);
            }
    
            // Filter images to only show search results
            // const results = images.filter(item => item.name.toLowerCase().indexOf(search) != -1);
            // const results = images.filter(item => searchResults.includes(item.id));
            const results = images.filter(item => searchResults.find(result => result.id == item.id));
            return res.json(results);
    
        }).catch((e) => {
            // Error retrieving items from datastore
            console.error(e);
            res.status(500);
            res.json({ success: false });
        })
    });
});

// DELETE /images/{id} endpoint. Deletes the image with given ID if possible
router.delete('/:id', (req, res) => {
    // Create key to find specified image
    const key = datastore.key(['image', parseInt(req.params.id, 10)]);

    // Create transaction
    const transaction = datastore.transaction();
    transaction.run()
        .then(() => transaction.get(key))   // Get the image from the datastore
        .then(results => {
            // Verify image exists and is owned by the current user
            if (results && results.length > 0 && results[0].user === req.user.id) {
                // Delete entry and commit
                transaction.delete(key);
                transaction.commit().then(() => {
                    // Delete image file from Cloud Storage
                    bucket.file(results[0].url).delete();
                    bucket.file('thumbnails/' + results[0].url).delete();

                    // // Delete image's text file from Cloud Storage
                    // ocrBucket.file(results[0].url + '.txt').delete().catch(e => {
                    //     console.log("image text file cannot be deleted (probably doesn't exist)");
                    // });

                    // Delete image from search index
                    request.delete(config.searchAPI + req.params.id);

                    res.status(202); // Request Accepted
                    res.json({ success: true });
                });
            } else {
                // Invalid action; abort
                transaction.rollback();
                res.status(403); // Forbidden
                res.json({ success: false });
            }
        }).catch(e => {
            // Unknown error during transaction
            // Possibly due to state invalidation (image no longer exists)
            transaction.rollback();
            console.log(e);
            res.status(500);
            res.json({ success: false });
        });
});

module.exports = router;
