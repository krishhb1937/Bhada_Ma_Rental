const express = require('express');
const router = express.Router();
const { 
  createProperty, 
  getAllProperties, 
  getPropertyById, 
  updateProperty, 
  deleteProperty,
  getPropertiesByOwner
} = require('../controllers/propertyController');
const auth = require('../middlewares/authMiddleware');
const { upload, handleUploadErrors } = require('../middlewares/upload');

// Test endpoint to check if server is working
router.get('/test', (req, res) => {
  res.json({ message: 'Property routes are working!' });
});

// POST /api/properties – Add property (owner only)
router.post('/', auth, upload.array('photos', 5), handleUploadErrors, createProperty);

// GET /api/properties – View all properties
router.get('/', getAllProperties);

// GET /api/properties/owner/my-properties – Get properties by current owner
router.get('/owner/my-properties', auth, getPropertiesByOwner);

// GET /api/properties/:id – View single property
router.get('/:id', getPropertyById);

// PATCH /api/properties/:id – Update property (owner only)
router.patch('/:id', auth, upload.array('photos', 5), handleUploadErrors, updateProperty);

// DELETE /api/properties/:id – Delete property (owner only)
router.delete('/:id', auth, deleteProperty);

module.exports = router;
