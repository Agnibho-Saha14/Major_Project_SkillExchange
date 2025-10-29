const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    userId: { type: String, default: 'anonymous' },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const teachingFormatSchema = new mongoose.Schema(
  {
    onlineSessions: { type: Boolean, default: false },
    inPersonSessions: { type: Boolean, default: false },
    flexibleSchedule: { type: Boolean, default: false },
    provideMaterials: { type: Boolean, default: false }
  },
  { _id: false }
);

const skillSchema = new mongoose.Schema(
  {
    ownerId: { type: String, required: false }, // <- important for ownership checks
    title: { type: String, required: true, trim: true },
    instructor: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    level: { type: String, required: true, enum: ['Beginner', 'Intermediate', 'Advanced'] },
    duration: { type: String, required: true, trim: true },
    timePerWeek: { type: Number, required: true, trim: true },
    certificateUrl: { type: String, default: '' },
    credentialId: { type: String, default: '', trim: true },
    price: { type: Number, default: 0 },
    priceType: { type: String, enum: ['course'] },
    paymentOptions: { type: String, required: true, enum: ['paid', 'exchange', 'both'] },
    description: { type: String, required: true },
    skills: { type: [String], default: [] },
    prerequisites: { type: String, default: '' },
    learningOutcomes: { type: String, default: '' },
    teachingFormat: { type: teachingFormatSchema, default: () => ({}) },
    status: { type: String, enum: ['draft', 'published', 'inactive'], default: 'draft' },
    // In your Skill model file
ratings: [
  {
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    userId: { type: String, required: true }, // Make this required
    createdAt: { type: Date, default: Date.now }
  }
],
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0, min: 0 },
    email: { type: String, required: false, default: '' } // not strictly required so create won't fail
  },
  { timestamps: true }
);

skillSchema.methods.calculateAverageRating = function () {
  if (!this.ratings || this.ratings.length === 0) {
    this.averageRating = 0;
    this.totalRatings = 0;
  } else {
    const sum = this.ratings.reduce((acc, r) => acc + r.rating, 0);
    this.averageRating = Math.round((sum / this.ratings.length) * 10) / 10;
    this.totalRatings = this.ratings.length;
  }
};

const Skill = mongoose.model('Skill', skillSchema);
module.exports = Skill;