const express = require('express');
const sharp = require('sharp');
const fileType = require('file-type');
const Storage = require('@google-cloud/storage');
const Datastore = require('@google-cloud/datastore');

const config = require('./config');

// Create Google Cloud Storage/Datastore references
const storage = Storage({
    projectId: config.projectId
});
const datastore = new Datastore({
    projectId: config.projectId
});
const bucket = storage.bucket(config.bucketName);

const router = express.Router();


// Function to generate a random alphanumeric string.
//  entropy specifies the number of characters (and thus the randomness)
const generateId = (entropy = 10) => {    
    const alphanumerics = "0123456789abcedfghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let id = "";
    for (var i = 0; i < entropy; i++) {
        var value = Math.floor(Math.random() * alphanumerics.length);
        id += alphanumerics[value];
    }
    return id;
};

// Returns the image type if supported, else false
const imageType = (imageBuffer) => {
    const type = fileType(imageBuffer);
    switch (type.mime) {
        case 'image/png':
        case 'image/gif':
        case 'image/jpg':
        case 'image/jpeg':
            return type;
        default:
            return false;
    }
};

// Returns a promise that resolves with a thumbnailed version of the image
const thumbnail = (imageBuffer) => {
    return sharp(imageBuffer)
        .resize(400,300)
        .min()
        .crop()
        .toBuffer();
};

// POST /upload endpoint. Receives a single image and uploads to cloud.
router.post('/', (req, res) => {

    // Check file exists
    if (req.files && req.files.image) {
        const image = req.files.image;
        const type = imageType(image.data);

        // Verify file is an image
        if (type !== false) {
            console.log('Uploading '+image.name);
            const id = generateId();
            const url = id + '.' + type.ext;
            const file = bucket.file(url);
            const thumbnailFile = bucket.file('thumbnails/' + url);

            // Create new key; allow for auto-generated ID
            const key = datastore.key(['image']);
            const date = new Date();
            const entity = {
                key,
                data: {
                    name: image.name,
                    url,
                    user: req.user.id,
                    date
                }
            };

            const uploadConfig = {
                metadata: {
                    contentType: type.mime
                },
                public: true
            };
            // Wait for image (+ thumbnail) to upload to Cloud Storage, and entry to appear in Datastore 
            Promise.all([
                datastore.save(entity),
                file.save(image.data, uploadConfig),
                thumbnail(image.data).then(thumbnailBuffer => {
                    return thumbnailFile.save(thumbnailBuffer, uploadConfig);
                })
            ]).then(() => {
                res.status(201); // Created
                // Get auto-generated ID from key object, and return data to user
                res.json({
                    id: key.id,
                    name: image.name,
                    url: config.bucketHost + url,
                    thumbnail: config.bucketHost + 'thumbnails/' + url,
                    date,
                    status: 'pending'
                });
            }).catch((e) => {
                // Either upload or datastore entry failed.
                console.log("Upload/datastore error");
                console.error(e);
                res.status(500);
                res.json({ success: false });
            });
            
        } else {
            res.status(415); // Unsupported media
            res.json({ success: false });    
        }
    } else {
        res.status(400); // Bad request
        res.json({ success: false });
    }
});

module.exports = router;