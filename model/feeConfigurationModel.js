const mongoose = require("mongoose");

const feeConfigurationSchema = new mongoose.Schema({
  feeId: {
    type: String,
    required: [true, "Fee configuration spec must have a Fee Id"],
    unique: true,
    trim: true,
    maxlength: [8, "Fee Id must be 8 characters long"],
    minlength: [8, "Fee Id must be 8 characters long"],
  },
  feeCurrency: {
    type: String,
    required: [true, "Fee configuration spec must have a Fee currency"],
  },
  feeLocale: {
    type: String,
    required: [true, "Fee configuration spec must have a Fee locale"],
  },
  feeEntity: {
    type: String,
    required: [true, "Fee configuration spec must have a Fee entity"],
  },
  entityProperty: {
    type: String,
    required: [true, "Fee configuration spec must have a entity property"],
  },
  feeType: {
    type: String,
    required: [true, "Fee configuration spec must have a Fee Type"],
  },
  feeValue: {
    type: String,
    required: [true, "Fee configuration spec must have a Fee value"],
  },
});

//create a model from the schema for Fee Configuration Spec(FSC)
const FCS = mongoose.model("FeeConfiguration", feeConfigurationSchema);

module.exports = FCS;
