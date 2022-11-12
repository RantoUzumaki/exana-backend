import mongoose from "mongoose";
import express from "express";
import * as dotenv from "dotenv";

const ENV = dotenv.config();
const app = express();

const url = `mongodb+srv://${ENV.parsed.USERNAME_MONGODB}:${ENV.parsed.PASSWORD_MONGODB}@${ENV.parsed.CLUSTER_MONGODB}.ok0wnuj.mongodb.net/?retryWrites=true&w=majority`;

mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
});

app.get("/", function (request, response) {
  response.send("Hello World!");
});

app.listen(8080, function () {
  console.log("Started application on port %d", 8080);
});
