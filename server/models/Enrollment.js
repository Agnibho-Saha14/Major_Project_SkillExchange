const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true }, // Clerk user ID
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    status: { type: String, enum: ['paid', 'exchange_pending', 'enrolled'], default: 'enrolled' },
    dateEnrolled: { type: Date, default: Date.now },
    transactionId: { type: String },
    completedModules: { type: [String], default: [] } // NEW FIELD: Array of completed module _id strings
  },
  { timestamps: true }
);

// Ensures a user can only enroll in a skill once
enrollmentSchema.index({ userId: 1, skillId: 1 }, { unique: true });

// Ensure the 'Skill' model is registered (it should be in Skill.js, but this prevents errors)
try {
  mongoose.model('Skill');
} catch (error) {
  require('./Skill'); // Loads the Skill model if it's not already loaded
}

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
module.exports = Enrollment;