/**
 * Helper function for AppliedFeeValue in the response body
 * For fee computation
 * @param {*} obj // Object
 * @param {*} amount // Number
 * @returns
 */
const appliedFeeValue = (obj, amount) => {
  let total;
  if (obj.feeValue.includes(":")) {
    let valueArr = obj.feeValue.split(":");
    let value = Number(valueArr[0]);
    let percentValue = Number(valueArr[1]);
    total = value + (percentValue / 100) * amount;
  } else {
    if (obj.feeType === "PERC") {
      total = (Number(obj.feeValue) / 100) * amount;
    } else {
      total = Number(obj.feeValue);
    }
  }

  return Math.round(total);
};

/**
 * Helper function for ChargeAmount in the response body
 * For fee computation
 * @param {*} obj //Object
 * @param {*} amount // Number
 * @param {*} bearsFee //Boolean
 * @returns
 */
const chargeAmount = (obj, amount, bearsFee) => {
  if (bearsFee) {
    return Number(amount) + appliedFeeValue(obj, amount);
  } else {
    return amount;
  }
};

/**
 *
 * @param {*} obj //Object
 * @param {*} amount // Number
 * @param {*} bearsFee //Boolean
 * @returns
 */
const settlementAmount = (obj, amount, bearsFee) => {
  return chargeAmount(obj, amount, bearsFee) - appliedFeeValue(obj, amount);
};

module.exports = { appliedFeeValue, chargeAmount, settlementAmount };
