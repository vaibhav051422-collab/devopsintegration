import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import multer from 'multer';
import * as Minio from 'minio';
import Metadata from './schema/metadata.js';

dotenv.config();
const app = express();


app.use(express.json());


const upload = multer({ storage: multer.memoryStorage() });

const minioEndpointRaw = process.env.MINIO_ENDPOINT || 'minio';
const [minioHostFromEndpoint, minioPortFromEndpoint] = minioEndpointRaw.split(':');
const minioPort = Number(process.env.MINIO_PORT || minioPortFromEndpoint || 9000);

const minioClient = new Minio.Client({
    endPoint: minioHostFromEndpoint,
    port: minioPort,
    useSSL: false,
    accessKey: process.env.MINIO_ROOT_USER || 'admin',
    secretKey: process.env.MINIO_ROOT_PASSWORD || 'password123'
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});


app.post('/api/metadata', async (req, res) => {
    try {
        const newMetadata = new Metadata(req.body);
        await newMetadata.save();
        res.status(201).json(newMetadata);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


app.get('/api/metadata', async (req, res) => {
    try {
        const data = await Metadata.find({});
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



app.post('/api/upload-file', upload.single('file'), async (req, res) => {
    try {
        const bucketName = 'uploads';
        const fileName = `${Date.now()}-${req.file.originalname}`;

      
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) await minioClient.makeBucket(bucketName);

      
        await minioClient.putObject(bucketName, fileName, req.file.buffer);

        res.status(200).json({ 
            message: 'File uploaded', 
            filePath: `/${bucketName}/${fileName}` // This is stored in Metadata later [cite: 28]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/api/get-file', async (req, res) => {
    try {
        const { name } = req.query; // Expects ?name=filename
        const stream = await minioClient.getObject('uploads', name);
        stream.pipe(res); // Streams the file back to the client [cite: 38]
    } catch (error) {
        res.status(404).json({ error: "File not found" });
    }
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
       
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to MongoDB");
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error("Server startup failed", err);
    }
};

startServer();