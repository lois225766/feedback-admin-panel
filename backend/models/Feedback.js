
const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    courseId: { type: String, required: true },
    courseName: { type: String, required: true, trim: true },
    courseDuration: { type: String, required: true },
    comments: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
