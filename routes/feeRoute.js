const express = require("express");

const feeController = require("../controller/feeController");

const router = express.Router();

router
  .route("/fee")
  .get(feeController.getAllFSC)
  .post(feeController.createFeeConfigurationSpec);

router
  .route("/compute-transaction-fee")
  .post(feeController.createFeeComputation);

module.exports = router;
