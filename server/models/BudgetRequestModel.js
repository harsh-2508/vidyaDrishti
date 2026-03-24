import mongoose from "mongoose";

const budgetRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'A request must have a title']
  },
  category: {
    type: String,
    enum: ['Infrastructure', 'Mid-Day Meal', 'Books/Stationery', 'Staff Salary', 'Medical', 'Other'],
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please specify the amount needed']
  },
  description: {
    type: String,
    trim: true
  },
  // --- FIX START ---
  urgency: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'], // ✅ Allows 'Critical'
    default: 'Medium',
  },
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'Approved', 'Funds Released', 'Rejected'], // ✅ Status steps
    default: 'Pending',
  },
  // --- FIX END ---
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const BudgetRequest = mongoose.model('BudgetRequest', budgetRequestSchema);
export default BudgetRequest;