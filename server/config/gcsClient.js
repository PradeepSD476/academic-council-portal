import dotenv from 'dotenv';
dotenv.config();
import { Storage } from '@google-cloud/storage';
import path from 'path';


const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: process.env.KEYFILENAME
});

const bucketName = process.env.GCS_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

export { bucket, storage };