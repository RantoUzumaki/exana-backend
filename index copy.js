import express, { json, urlencoded } from "express";
import cors from "cors";
import db from "./app/models/index.js";

require("dotenv").config();

const app = express();
const Role = db.role;

app.use(cors());

// parse requests of content-type - application/json
app.use(json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(urlencoded({ extended: true }));

const url = `mongodb+srv://${process.env.USERNAME_MONGODB}:${process.env.PASSWORD_MONGODB}@${process.env.CLUSTER_MONGODB}.ok0wnuj.mongodb.net/?retryWrites=true&w=majority`;

db.mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connect to MongoDB.");
    // initial();
  })
  .catch((err) => {
    console.error("Connection error", err);
    process.exit();
  });

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to EXANA Backend application." });
});

// routes
require("./app/routes/auth.routes")(app);

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

function initial() {
  Role.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      new Role({
        name: "user",
      }).save((err) => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'user' to roles collection");
      });

      new Role({
        name: "admin",
      }).save((err) => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'admin' to roles collection");
      });
    }
  });
}
