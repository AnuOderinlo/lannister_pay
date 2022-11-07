const FSC = require("./../model/feeConfigurationModel");
const {
  appliedFeeValue,
  chargeAmount,
  settlementAmount,
} = require("./../utils/feeComputationUtils");

/**
 * createFeeConfigurationSpec API create the Fee Configuration Specification(FCS)
 * @param {*} req //Request
 * @param {*} res //Response
 */
exports.createFeeConfigurationSpec = async (req, res) => {
  try {
    const { FeeConfigurationSpec } = req.body;
    const fscArr = FeeConfigurationSpec.split("\n").map((el) => el.split(" "));
    const dataBody = [];

    for (let i = 0; i < fscArr.length; i++) {
      let fscObj = {};
      fscObj["feeId"] = fscArr[i][0];
      fscObj["feeCurrency"] = fscArr[i][1];
      fscObj["feeLocale"] = fscArr[i][2];
      fscObj["feeEntity"] = fscArr[i][3].split("(")[0];
      fscObj["entityProperty"] = fscArr[i][3].split("(")[1].slice(0, -1);
      fscObj["feeType"] = fscArr[i][6];
      fscObj["feeValue"] = fscArr[i][7];

      dataBody.push(fscObj);
    }

    // console.log(dataBody);
    const newFSC = await FSC.create(dataBody);

    res.status(200).json({
      status: "OK",
      message: "Successfully created a Fee Configuration Spec",
      // data: newFSC,
    });
  } catch (err) {
    // console.log(err);
    res.status(400).json({
      status: "Failed",
      message: `Unable to create a FSC, ${err}`,
    });
  }
};

/**
 * getAllFSC API fetch all Fee Configuration Spec from the database
 * @param {*} req
 * @param {*} res
 */
exports.getAllFSC = async (req, res) => {
  try {
    const allFSC = await FSC.find(); //query

    res.status(200).json({
      status: "OK",
      message: "Successfully fetched all Fee Configuration Spec",
      allFSC,
    });
  } catch (err) {
    // console.log(err);

    res.status(400).json({
      status: "Failed",
      message: `Unable to fetch a FSC, ${err}`,
    });
  }
};

/**
 * deleteAllFSC API: to delete all Fee Configuration Specification from the Database
 * @param {*} req
 * @param {*} res
 */
exports.deleteAllFSC = async (req, res) => {
  try {
    await FSC.deleteMany();
    res.status(200).json({
      status: "OK",
      message: "Successfully deleted all Fee Configuration Spec",
    });
  } catch (err) {
    res.status(400).json({
      status: "Failed",
      message: `Unable to delete all FSC, ${err}`,
    });
  }
};

/**
 * createFeeComputation API create the fee computation based on a specific Fee Configuration Spec
 * @param {*} req
 * @param {*} res
 */
exports.createFeeComputation = async (req, res) => {
  try {
    const allFSC = await FSC.find();

    const { Amount, Currency, CurrencyCountry, Customer, PaymentEntity } =
      req.body;
    const { BearsFee } = Customer;
    const { Issuer, Brand, Number, SixID, Type, Country } = PaymentEntity;
    const lessSpecificFSC = [];
    const moreSpecificFSC = [];

    //Edge case 1: if the Currency is not NGN no FSC for that transaction
    if (Currency !== "NGN") {
      res.status(400).json({
        Error: `No Fee configuration for ${Currency} transactions`,
      });
    } else {
      let locale = Country === CurrencyCountry ? "LOCL" : "INTL";
      for (const el of allFSC) {
        if (Country == "NG") {
          if (el.feeLocale === locale || el.feeLocale === "*") {
            if (Type === el.feeEntity || Type === "" || el.feeEntity === "*") {
              if (
                el.feeEntity === "CREDIT-CARD" &&
                (el.entityProperty === Issuer ||
                  el.entityProperty === Brand ||
                  el.entityProperty === Number ||
                  el.entityProperty == SixID ||
                  el.entityProperty === "*")
              ) {
                // console.log(el);
                moreSpecificFSC.push(el);
                // break;
              } else if (
                el.feeEntity === "DEBIT-CARD" &&
                (el.entityProperty === Issuer ||
                  el.entityProperty === Brand ||
                  el.entityProperty === Number ||
                  el.entityProperty == SixID ||
                  el.entityProperty === "*")
              ) {
                moreSpecificFSC.push(el);
                // console.log(el);
                // break;
              } else if (
                el.feeEntity === "BANK-ACCOUNT" &&
                (el.entityProperty === Issuer ||
                  el.entityProperty === Brand ||
                  el.entityProperty === Number ||
                  el.entityProperty == SixID ||
                  el.entityProperty === "*")
              ) {
                moreSpecificFSC.push(el);
                // console.log(el);
                // break;
              } else if (
                el.feeEntity === "USSD" &&
                (el.entityProperty === Issuer ||
                  el.entityProperty === Brand ||
                  el.entityProperty === Number ||
                  el.entityProperty == SixID ||
                  el.entityProperty === "*")
              ) {
                moreSpecificFSC.push(el);
                // console.log(el);
                // break;
              } else if (
                el.feeEntity === "WALLET-ID" &&
                (el.entityProperty === Issuer ||
                  el.entityProperty === Brand ||
                  el.entityProperty === Number ||
                  el.entityProperty == SixID ||
                  el.entityProperty === "*")
              ) {
                moreSpecificFSC.push(el);
                // break;
              } else {
                if (
                  `${el.feeLocale}${el.feeEntity}${el.entityProperty}`.includes(
                    "*"
                  ) &&
                  el.feeEntity.includes("*")
                ) {
                  lessSpecificFSC.push(el);

                  continue;
                }
              }
            }
          }
        }
      }

      //Differentiating moreSpecificFSC into higher precedence through entity property
      let numberMoreSpecific = [];
      let sixIDMoreSpecific = [];
      let brandMoreSpecific = [];
      let issuerMoreSpecific = [];
      let allMoreSpecific = [];

      moreSpecificFSC.forEach((el) => {
        if (el.entityProperty === Number) {
          numberMoreSpecific.push(el);
        } else if (el.entityProperty === SixID) {
          sixIDMoreSpecific.push(el);
        } else if (el.entityProperty === Brand) {
          brandMoreSpecific.push(el);
        } else if (el.entityProperty === Issuer) {
          issuerMoreSpecific.push(el);
        } else if (el.entityProperty === "*") {
          allMoreSpecific.push(el);
        }
      });

      let data;
      if (moreSpecificFSC.length > 0) {
        let fscArr;
        if (numberMoreSpecific.length > 0) {
          fscArr = numberMoreSpecific;
        } else if (sixIDMoreSpecific.length > 0) {
          fscArr = sixIDMoreSpecific;
        } else if (brandMoreSpecific.length > 0) {
          fscArr = brandMoreSpecific;
        } else if (issuerMoreSpecific.length > 0) {
          fscArr = issuerMoreSpecific;
        } else if (allMoreSpecific.length > 0) {
          fscArr = allMoreSpecific;
        }

        data = {};
        data["AppliedFeeID"] = fscArr[0].feeId;
        data["AppliedFeeValue"] = appliedFeeValue(fscArr[0], Amount);
        data["ChargeAmount"] = chargeAmount(fscArr[0], Amount, BearsFee);
        data["SettlementAmount"] = settlementAmount(
          fscArr[0],
          Amount,
          BearsFee
        );
      } else if (lessSpecificFSC.length > 0) {
        console.log("lessSpecific", lessSpecificFSC);
        data = {};
        data["AppliedFeeID"] = lessSpecificFSC[0].feeId;
        data["AppliedFeeValue"] = appliedFeeValue(lessSpecificFSC[0], Amount);
        data["ChargeAmount"] = chargeAmount(
          lessSpecificFSC[0],
          Amount,
          BearsFee
        );
        data["SettlementAmount"] = settlementAmount(
          lessSpecificFSC[0],
          Amount,
          BearsFee
        );
      } else {
        return res.status(400).json({
          Error: "No fee configuration for this transaction",
        });
      }

      res.status(200).json({
        // status: "OK",
        data,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "Failed",
      message: `Unable to Create Fee Computation, ${err}`,
    });
  }
};
