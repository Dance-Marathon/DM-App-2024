const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export functions from submodules
exports.eliminate = require("./eliminate").eliminate;
