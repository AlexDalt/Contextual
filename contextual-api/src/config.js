const PROJECT_ID = 'contextual-186413';
const BUCKET_NAME = 'contextual';
const BUCKET_HOST = 'https://storage.googleapis.com/' + BUCKET_NAME + '/';
const SEARCH_API = 'https://search-dot-contextual-186413.appspot.com/';

// Configuration variables
module.exports = {
    projectId: PROJECT_ID,
    bucketName: BUCKET_NAME,
    bucketHost: BUCKET_HOST,
    searchAPI: SEARCH_API,
    ocrBucket: 'contextual-ocr',
    authSecret: 'secret',
    issuer: 'contextual'
};
