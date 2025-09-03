
// Backend (server.js) - Updated
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Updated Model for AR points with model type
const ARPointSchema = new mongoose.Schema({
  name: String,
  modelUrl: String,
  modelType: { type: String, default: 'box' }, // 'box', 'sphere', 'monk', etc.
  latitude: Number,
  longitude: Number,
  createdAt: { type: Date, default: Date.now }
});
const ARPoint = mongoose.model('ARPoint', ARPointSchema);

// Get all AR points
app.get('/api/arpoints', async (req, res) => {
  try {
    console.log("Fetching AR points");
    const points = await ARPoint.find().sort({ createdAt: -1 });
    res.json(points);
    console.log("AR points fetched successfully:", points);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new AR point
app.post('/api/arpoints', async (req, res) => {
  try {
    console.log("Received AR point data:", req.body);
    const { name, modelUrl, latitude, longitude, modelType } = req.body;
    const newPoint = new ARPoint({ name, modelUrl, latitude, longitude, modelType });
    await newPoint.save();
    console.log("New AR point created successfully:", newPoint);
    res.status(201).json(newPoint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete AR point (optional)
app.delete('/api/arpoints/:id', async (req, res) => {
  try {
    console.log("Deleting AR point with ID:", req.params.id);
    await ARPoint.findByIdAndDelete(req.params.id);
    res.json({ message: 'Point deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));