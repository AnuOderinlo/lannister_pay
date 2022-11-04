const FSC = require("./../model/feeConfigurationModel");
const redis = require("redis");
const client = redis.createClient();
const port = process.env.PORT || 3000;

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

const chargeAmount = (obj, amount, bearsFee) => {
  if (bearsFee) {
    return Number(amount) + appliedFeeValue(obj, amount);
  } else {
    return amount;
  }
};

const settlementAmount = (obj, amount, bearsFee) => {
  return chargeAmount(obj, amount, bearsFee) - appliedFeeValue(obj, amount);
};

// console.log(appliedFeeValue(testObj, 3500));

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
      for (const el of allFSC) {
        if (Country == "NG") {
          if (el.feeLocale === "LOCL" || el.feeLocale === "*") {
            if (Type === el.feeEntity || Type === "" || el.feeEntity === "*") {
              if (
                Brand === el.entityProperty ||
                Brand === "" ||
                Issuer === el.entityProperty ||
                Number === el.entityProperty ||
                SixID === el.entityProperty ||
                el.entityProperty === "*"
              ) {
                if (
                  el.feeEntity === "CREDIT-CARD" &&
                  (el.entityProperty === Issuer ||
                    el.entityProperty === Brand ||
                    el.entityProperty === Number ||
                    el.entityProperty === SixID ||
                    el.entityProperty === "*")
                ) {
                  // console.log(el);
                  moreSpecificFSC.push(el);
                  break;
                } else if (
                  el.feeEntity === "DEBIT-CARD" &&
                  (el.entityProperty === Issuer ||
                    el.entityProperty === Brand ||
                    el.entityProperty === Number ||
                    el.entityProperty === SixID ||
                    el.entityProperty === "*")
                ) {
                  moreSpecificFSC.push(el);
                  // console.log(el);
                  break;
                } else if (
                  el.feeEntity === "BANK-ACCOUNT" &&
                  (el.entityProperty === Issuer ||
                    el.entityProperty === Brand ||
                    el.entityProperty === Number ||
                    el.entityProperty === SixID ||
                    el.entityProperty === "*")
                ) {
                  moreSpecificFSC.push(el);
                  // console.log(el);
                  break;
                } else if (
                  el.feeEntity === "USSD" &&
                  (el.entityProperty === Issuer ||
                    el.entityProperty === Brand ||
                    el.entityProperty === Number ||
                    el.entityProperty === SixID)
                ) {
                  moreSpecificFSC.push(el);
                  // console.log(el);
                  break;
                } else if (
                  el.feeEntity === "WALLET-ID" &&
                  (el.entityProperty === Issuer ||
                    el.entityProperty === Brand ||
                    el.entityProperty === Number ||
                    el.entityProperty === SixID)
                ) {
                  moreSpecificFSC.push(el);
                  console.log(el);
                  break;
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
      }

      let data;
      if (moreSpecificFSC.length > 0) {
        data = {};
        data["AppliedFeeID"] = moreSpecificFSC[0].feeId;
        data["AppliedFeeValue"] = appliedFeeValue(moreSpecificFSC[0], Amount);
        data["ChargeAmount"] = chargeAmount(
          moreSpecificFSC[0],
          Amount,
          BearsFee
        );
        data["SettlementAmount"] = settlementAmount(
          moreSpecificFSC[0],
          Amount,
          BearsFee
        );
      } else {
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
      }

      // await client.connect(port, "127.0.0.1");
      // client.set("data", data);

      res.status(200).json({
        // status: "OK",
        data,
      });
    }
  } catch (err) {
    console.log(err);

    res.status(400).json({
      status: "Failed",
      message: `Unable to fetch a FSC, ${err}`,
    });
  }
};

// exports.getCache = async (req, res) => {
//   await client.connect();
//   client.get("data", (err, result) => {
//     if (result) {
//       res.status(200).json({
//         // status: "OK",
//         data,
//       });
//     } else {
//       createFeeComputation(req, res);
//     }
//   });
// };
