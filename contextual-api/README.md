# Contextual API

A Node.js application providing the backend for Contextual

## Installation

Run `npm install`

## Execution

Currently only runs on a Unix-based shell (or bash via Windows Subsystem for Linux) due to environment variable support.

Requires the obtaining of a Service Account Key via the Google Cloud Console.

Run `GOOGLE_APPLICATION_CREDENTIALS=/path/to/keystore.json npm run start`

This loads the Google Cloud API private key from the provided path and sets the application to listen on port 3000