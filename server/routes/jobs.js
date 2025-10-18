const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  applyJob
} = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getJobs);
router.get('/:id', getJob);
router.post('/', protect, authorize('admin', 'instructor'), createJob);
router.put('/:id', protect, authorize('admin', 'instructor'), updateJob);
router.delete('/:id', protect, authorize('admin', 'instructor'), deleteJob);
router.post('/:id/apply', protect, applyJob);

module.exports = router;
