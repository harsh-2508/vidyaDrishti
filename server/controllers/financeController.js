import BudgetRequest from "../models/BudgetRequestModel.js";

export const createBudgetRequest = async (req, res) => {
  try {
    const { title, category, amount, description, urgency } = req.body;
    const newRequest = await BudgetRequest.create({
      requester: req.user.id,
      title, category, amount, description, urgency,
    });
    res.status(201).json({ status: "success", data: { request: newRequest } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

export const getMyBudgetRequests = async (req, res) => {
  try {
    // FIX: Use req.user.id (from protect middleware) and use await
    const requests = await BudgetRequest.find({ requester: req.user.id })
                                      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { requests }
    });
  } catch(err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

export const toggleRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const current = await BudgetRequest.findById(id);
    let nextStatus = "Pending";
    if (current.status === 'Pending') nextStatus = 'Approved';
    else if (current.status === 'Approved') nextStatus = 'Funds Released';

    const updated = await BudgetRequest.findByIdAndUpdate(id, { status: nextStatus }, { new: true });
    res.status(200).json({ status: 'success', data: { updated } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};