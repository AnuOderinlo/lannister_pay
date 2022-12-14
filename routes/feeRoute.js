const express = require("express");

const feeController = require("../controller/feeController");

const router = express.Router();

router
  .route("/fees")
  .get(feeController.getAllFSC)
  .post(feeController.createFeeConfigurationSpec)
  .delete(feeController.deleteAllFSC);

router
  .route("/compute-transaction-fee")
  .post(feeController.createFeeComputation);

module.exports = router;
