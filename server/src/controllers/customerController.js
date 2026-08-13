const Customer = require("../models/Customer");

const createCustomer = async (req, res) => {
  try {
    const { name, phone, email, notes } = req.body;

    const existingCustomer = await Customer.findOne({ phone });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "Customer with this phone already exists",
      });
    }

    const customer = await Customer.create({
      name,
      phone,
      email,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create customer",
      error: error.message,
    });
  }
};

const getCustomerByPhone = async (req, res) => {
  try {
    const { phone } = req.params;

    const customer = await Customer.findOne({ phone });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
      error: error.message,
    });
  }
};

module.exports = {
  createCustomer,
  getCustomerByPhone,
};