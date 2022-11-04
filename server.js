const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: "./config.env" });

const app = require("./app");

const DB = process.env.DATABASE;

mongoose.connect(DB).then((con) => {
  console.log("Database successfully connected");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Listening at port " + port);
});
