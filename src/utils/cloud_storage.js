const { Storage } = require('@google-cloud/storage');
const { format } = require('util');
const env = require('../config/env');
const url = require('url');
const { v4: uuidv4 } = require('uuid');
const uuid = uuidv4();

const storage = new Storage({
  projectId: 'kotlin-nestjs-ecomm',
  keyFilename: './serviceAccountKey.json',
});

const bucket = storage.bucket('gs://kotlin-nestjs-ecomm.appspot.com/');

module.exports = (file, pathImage) => {
  return new Promise((resolve, reject) => {
    if (pathImage) {
      if (pathImage != null || pathImage != undefined) {
        let fileUpload = bucket.file(`${pathImage}`);
        const blobStream = fileUpload.createWriteStream({
          metadata: {
            contentType: 'image/png',
            metadata: {
              firebaseStorageDownloadTokens: uuid,
            },
          },
          resumable: false,
        });

        blobStream.on('error', (error) => {
          console.log('파이어베이스 사용에 문제가 있습니다.', error);
          reject('Something is wrong! Unable to upload at the moment.');
        });

        blobStream.on('finish', () => {
          // The public URL can be used to directly access the file via HTTP.
          const url = format(
            `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${fileUpload.name}?alt=media&token=${uuid}`,
          );
          console.log('Cloud storage url: ', url);
          resolve(url);
        });

        blobStream.end(file.buffer);
      }
    }
  });
};
