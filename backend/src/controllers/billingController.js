const Billing = require("../models/billing");
const Patient = require("../models/patient");
const Doctor = require("../models/doctor");
const Appointment = require("../models/appointment");

const calculateTotal = ({
  consultationFee,
  additionalCharges = 0,
  discount = 0,
  tax = 0,
}) => {
  const subtotal = consultationFee + additionalCharges;
  const total = subtotal - discount + tax;

  return {
    subtotal,
    total,
  };
};

// Create billing
const createBilling = async (req, res) => {
  try {
    const {
      patient,
      doctor,
      appointment,
      consultationFee,
      additionalCharges = 0,
      discount = 0,
      tax = 0,
      paymentStatus = "pending",
      paidAmount = 0,
      paymentMethod = "cash",
      paymentDate,
      notes,
    } = req.body;

    if (!patient || !doctor || !appointment) {
      return res.status(400).json({
        success: false,
        message: "Patient, doctor and appointment are required",
      });
    }

    if (consultationFee === undefined || consultationFee === null) {
      return res.status(400).json({
        success: false,
        message: "Consultation fee is required",
      });
    }

    const patientExists = await Patient.findOne({
      _id: patient,
      isActive: true,
    });

    if (!patientExists) {
      return res.status(404).json({
        success: false,
        message: "Active patient not found",
      });
    }

    const doctorExists = await Doctor.findOne({
      _id: doctor,
      isActive: true,
    });

    if (!doctorExists) {
      return res.status(404).json({
        success: false,
        message: "Active doctor not found",
      });
    }

    const appointmentExists = await Appointment.findById(appointment);

    if (!appointmentExists) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (
      appointmentExists.patient.toString() !== patient.toString() ||
      appointmentExists.doctor.toString() !== doctor.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "Patient, doctor and appointment relationship does not match",
      });
    }

    const existingBilling = await Billing.findOne({
      appointment,
      isActive: true,
    });

    if (existingBilling) {
      return res.status(409).json({
        success: false,
        message: "Billing already exists for this appointment",
      });
    }

    if (consultationFee < 0) {
      return res.status(400).json({
        success: false,
        message: "Consultation fee cannot be negative",
      });
    }

    if (additionalCharges < 0 || discount < 0 || tax < 0) {
      return res.status(400).json({
        success: false,
        message: "Additional charges, discount and tax cannot be negative",
      });
    }

    const { total } = calculateTotal({
      consultationFee,
      additionalCharges,
      discount,
      tax,
    });

    if (total < 0) {
      return res.status(400).json({
        success: false,
        message: "Total amount cannot be negative",
      });
    }

    if (paidAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Paid amount cannot be negative",
      });
    }

    if (paidAmount > total) {
      return res.status(400).json({
        success: false,
        message: "Paid amount cannot be greater than total amount",
      });
    }

    let finalPaymentStatus = paymentStatus;

    if (paidAmount === 0) {
      finalPaymentStatus = "pending";
    } else if (paidAmount < total) {
      finalPaymentStatus = "partial";
    } else if (paidAmount === total) {
      finalPaymentStatus = "paid";
    }

    const billing = await Billing.create({
      patient,
      doctor,
      appointment,
      consultationFee,
      additionalCharges,
      discount,
      tax,
      totalAmount: total,
      paymentStatus: finalPaymentStatus,
      paidAmount,
      paymentMethod,
      paymentDate:
        finalPaymentStatus === "pending"
          ? undefined
          : paymentDate || new Date(),
      notes,
      createdBy: req.user._id,
    });

    const populatedBilling = await Billing.findById(billing._id)
      .populate("patient", "name patientId phone email gender bloodGroup")
      .populate(
        "doctor",
        "user specialization qualification consultationFee department"
      )
      .populate(
        "appointment",
        "appointmentDate appointmentTime reason status consultationFee"
      )
      .populate("createdBy", "name email role");

    res.status(201).json({
      success: true,
      message: "Billing created successfully",
      data: {
        billing: populatedBilling,
      },
    });
  } catch (error) {
    console.error("Create billing error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating billing",
    });
  }
};

// Get all billing records
const getBillings = async (req, res) => {
  try {
    const billings = await Billing.find({ isActive: true })
      .populate("patient", "name patientId phone email")
      .populate(
        "doctor",
        "user specialization qualification consultationFee department"
      )
      .populate(
        "appointment",
        "appointmentDate appointmentTime reason status consultationFee"
      )
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Billing records retrieved successfully",
      count: billings.length,
      data: {
        billings,
      },
    });
  } catch (error) {
    console.error("Get billings error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving billing records",
    });
  }
};

// Get single billing
const getBillingById = async (req, res) => {
  try {
    const billing = await Billing.findOne({
      _id: req.params.id,
      isActive: true,
    })
      .populate("patient", "name patientId phone email gender bloodGroup")
      .populate(
        "doctor",
        "user specialization qualification consultationFee department"
      )
      .populate(
        "appointment",
        "appointmentDate appointmentTime reason status consultationFee"
      )
      .populate("createdBy", "name email role");

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: "Billing record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Billing record retrieved successfully",
      data: {
        billing,
      },
    });
  } catch (error) {
    console.error("Get billing error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving billing record",
    });
  }
};

// Get patient billing history
const getPatientBillingHistory = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      _id: req.params.patientId,
      isActive: true,
    }).select("patientId name phone email gender bloodGroup");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Active patient not found",
      });
    }

    const billings = await Billing.find({
      patient: patient._id,
      isActive: true,
    })
      .populate(
        "doctor",
        "user specialization qualification consultationFee department"
      )
      .populate(
        "appointment",
        "appointmentDate appointmentTime reason status consultationFee"
      )
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Patient billing history retrieved successfully",
      count: billings.length,
      data: {
        patient,
        billings,
      },
    });
  } catch (error) {
    console.error("Patient billing history error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving patient billing history",
    });
  }
};

// Update billing
const updateBilling = async (req, res) => {
  try {
    const billing = await Billing.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: "Billing record not found",
      });
    }

    const {
      additionalCharges,
      discount,
      tax,
      paidAmount,
      paymentStatus,
      paymentMethod,
      paymentDate,
      notes,
    } = req.body;

    const finalAdditionalCharges =
      additionalCharges !== undefined
        ? additionalCharges
        : billing.additionalCharges;

    const finalDiscount =
      discount !== undefined ? discount : billing.discount;

    const finalTax = tax !== undefined ? tax : billing.tax;

    if (
      finalAdditionalCharges < 0 ||
      finalDiscount < 0 ||
      finalTax < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Charges, discount and tax cannot be negative",
      });
    }

    const { total } = calculateTotal({
      consultationFee: billing.consultationFee,
      additionalCharges: finalAdditionalCharges,
      discount: finalDiscount,
      tax: finalTax,
    });

    if (total < 0) {
      return res.status(400).json({
        success: false,
        message: "Total amount cannot be negative",
      });
    }

    const finalPaidAmount =
      paidAmount !== undefined ? paidAmount : billing.paidAmount;

    if (finalPaidAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Paid amount cannot be negative",
      });
    }

    if (finalPaidAmount > total) {
      return res.status(400).json({
        success: false,
        message: "Paid amount cannot be greater than total amount",
      });
    }

    let finalPaymentStatus = paymentStatus;

    if (finalPaymentStatus === undefined) {
      if (finalPaidAmount === 0) {
        finalPaymentStatus = "pending";
      } else if (finalPaidAmount < total) {
        finalPaymentStatus = "partial";
      } else {
        finalPaymentStatus = "paid";
      }
    }

    billing.additionalCharges = finalAdditionalCharges;
    billing.discount = finalDiscount;
    billing.tax = finalTax;
    billing.totalAmount = total;
    billing.paidAmount = finalPaidAmount;
    billing.paymentStatus = finalPaymentStatus;

    if (paymentMethod !== undefined) {
      billing.paymentMethod = paymentMethod;
    }

    if (paymentDate !== undefined) {
      billing.paymentDate = paymentDate;
    } else if (
      finalPaymentStatus !== "pending" &&
      !billing.paymentDate
    ) {
      billing.paymentDate = new Date();
    }

    if (notes !== undefined) {
      billing.notes = notes;
    }

    await billing.save();

    const updatedBilling = await Billing.findById(billing._id)
      .populate("patient", "name patientId phone email gender bloodGroup")
      .populate(
        "doctor",
        "user specialization qualification consultationFee department"
      )
      .populate(
        "appointment",
        "appointmentDate appointmentTime reason status consultationFee"
      )
      .populate("createdBy", "name email role");

    res.status(200).json({
      success: true,
      message: "Billing updated successfully",
      data: {
        billing: updatedBilling,
      },
    });
  } catch (error) {
    console.error("Update billing error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating billing",
    });
  }
};

// Soft deactivate billing
const deactivateBilling = async (req, res) => {
  try {
    const billing = await Billing.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: "Billing record not found",
      });
    }

    billing.isActive = false;

    await billing.save();

    res.status(200).json({
      success: true,
      message: "Billing deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate billing error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deactivating billing",
    });
  }
};

module.exports = {
  createBilling,
  getBillings,
  getBillingById,
  getPatientBillingHistory,
  updateBilling,
  deactivateBilling,
};