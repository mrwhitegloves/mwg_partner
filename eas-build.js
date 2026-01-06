// eas-build.js
module.exports = {
  build: {
    preview: {
      android: {
        env: {
          GOOGLE_SERVICES_JSON: process.env.GOOGLE_SERVICES_JSON,
        },
      },
    },
    production: {
      android: {
        env: {
          GOOGLE_SERVICES_JSON: process.env.GOOGLE_SERVICES_JSON,
        },
      },
    },
  },
};