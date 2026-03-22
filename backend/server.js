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

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});


app.post('/metadata', async (req, res) => {
    try {
        const newMetadata = new Metadata(req.body);
        await newMetadata.save();
        res.status(201).json(newMetadata);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


app.get('/metadata', async (req, res) => {
    try {
        const data = await Metadata.find({});
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/metadata/:id', async (req, res) => {
    try {
        const record = await Metadata.findById(req.params.id);

        if (!record) {
            return res.status(404).json({ error: 'Record not found' });
        }

        // filePath is expected in format: /uploads/<filename>
        const filePath = record.filePath || '';
        const pathParts = filePath.split('/').filter(Boolean);
        const bucketName = pathParts[0];
        const fileName = pathParts.slice(1).join('/');

        if (bucketName && fileName) {
            try {
                await minioClient.removeObject(bucketName, fileName);
            } catch (error) {
                // Continue deleting metadata even if file was already removed.
            }
        }

        await Metadata.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Metadata and file deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



app.post('/upload-file', upload.single('file'), async (req, res) => {
    try {
        const bucketName = 'uploads';
        const fileName = `${Date.now()}-${req.file.originalname}`;

      
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) await minioClient.makeBucket(bucketName);

      //minioClient.putObject(...) takes that Buffer from Multer and streams it into the MinIO container.
        await minioClient.putObject(bucketName, fileName, req.file.buffer);

        res.status(200).json({ 
            message: 'File uploaded', 
            filePath: `/${bucketName}/${fileName}` 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/get-file', async (req, res) => {
    try {
        const { name } = req.query; // Expects ?name=filename
        const stream = await minioClient.getObject('uploads', name);
        // backend here just streams the file from MinIO to the client without loading it all into memory, making it efficient for large files.
        stream.pipe(res); 
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

// Only start server if this file is run directly, not when imported for testing
if (import.meta.url === `file://${process.argv[1]}`) {
    startServer();
}

export default app;