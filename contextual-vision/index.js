'use strict';

const vision = require('@google-cloud/vision')();
const datastore = require('@google-cloud/datastore')();
const request = require('request');


const OUTPUT_BUCKET = 'contextual-ocr';
const SEARCH_API = 'https://search-dot-contextual-186413.appspot.com/submit';

function detectText(bucketName, filename) {

    console.log(`Looking for text/labels in image ${filename}`);

    const annotationRequest = {
        image: { 
            source: {
                imageUri: `gs://${bucketName}/${filename}`
            }
        },
        features: [
            {
                type: "LABEL_DETECTION"
            },
            {
                type: "TEXT_DETECTION"
            }
        ]
    };

    return vision.annotateImage(annotationRequest)
        .then(([detections]) => {
            // Retrieve annotations
            const textAnnotations = detections.textAnnotations[0];
            const labelAnnotations = detections.labelAnnotations;

            // Extract text
            const descriptions = textAnnotations ? [textAnnotations.description] : [];
            
            // Extract labels
            for (let label of labelAnnotations) {
                descriptions.push(label.description);
            }

            console.log(`Extracted text/labels from image`);

            const imageQuery = datastore.createQuery('image').filter('url', filename);
            return datastore.runQuery(imageQuery).then(([results]) => {
                if (results.length == 0) {
                    throw new Error("Race condition detected; couldn't find file in datastore");
                }
    
                const entry = results[0];

                descriptions.push(entry.name);
                const text = descriptions.join('\n');
    
                const requestData = {
                    method: 'POST',
                    url: SEARCH_API,
                    body: {
                        id: parseInt(entry[datastore.KEY].id),
                        user: entry.user,
                        text
                    },
                    json: true
                };
    
                request(requestData, (err, response, body) => {
                    if (err) {
                        throw new Error("Search API request failed: " + err);
                    } else if (response.statusCode != "201") {
                        throw new Error("Received status code " + response.statusCode + "from search API; expected 201.\nRequest body: " + body);
                    } else {
                        console.log(`Search API data submitted (${text.length} chars)`);
                    }
                });
            });
        });
}

exports.ocrExtract = function processImage (event) {
    let file = event.data;

    return Promise.resolve()
        .then(() => {
            // if (file.resourceState === 'not_exists') {
            //     return;
            // }

            if (!file.bucket) {
                throw new Error('Bucket not provided');
            }
            if (!file.name) {
                throw new Error('Filename not provided');
            }

            if (file.name.startsWith('thumbnails/')) {
                return;
            }

            return detectText(file.bucket, file.name).then(() => {
                    console.log(`File ${file.name} processed.`);
            });
        });
};