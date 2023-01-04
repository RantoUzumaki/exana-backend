import app from "./app";
import db from "./app/models";
import dotenv from "dotenv";

dotenv.config();

const port = 8080;

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});

const url = `mongodb+srv://${process.env.USERNAME_MONGODB}:${process.env.PASSWORD_MONGODB}@${process.env.CLUSTER_MONGODB}.ok0wnuj.mongodb.net/?retryWrites=true&w=majority`;

db.mongoose
	.connect(url, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		console.log("Successfully connect to MongoDB.");
	})
	.catch((err) => {
		console.error("Connection error", err);
		process.exit();
	});
