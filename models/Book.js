const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    story: String,
  title: String,
  publishedYear: Number,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

module.exports = mongoose.model('Book', bookSchema);
