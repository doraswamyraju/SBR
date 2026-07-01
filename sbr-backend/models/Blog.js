const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Please add a slug'],
    unique: true,
    trim: true,
    lowercase: true
  },
  summary: {
    type: String,
    required: [true, 'Please add a summary']
  },
  content: {
    type: String,
    required: [true, 'Please add content']
  },
  image: {
    type: String,
    default: 'https://placehold.co/800x600/CCCCCC/333333?text=SBR+Blog'
  },
  category: {
    type: String,
    default: 'General'
  },
  author: {
    type: String,
    default: 'SBR Team'
  },
  publishedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Blog', BlogSchema);
