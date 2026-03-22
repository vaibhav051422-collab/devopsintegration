import mongoose from 'mongoose';

const metadataSchema = new mongoose.Schema({
  title: { type: String, required: true },       
  description: { type: String, required: true },
  filePath: { type: String, required: true }    
});

const Metadata = mongoose.model('Metadata', metadataSchema);
export default Metadata;