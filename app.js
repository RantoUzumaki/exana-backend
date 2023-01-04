import express from "express";
import bodyParser from "body-parser";
import routes from "./app/routes";

const app = express();

app.use(
	bodyParser.urlencoded({
		extended: true,
	}),
);

app.use(bodyParser.json({ limit: "1000mb" }));

app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header(
		"Access-Control-Allow-Methods",
		"DELETE, PUT, GET, POST, PATCH, OPTIONS",
	);
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept, Authorization, Content-Length, x-access-token",
	);
	res.header("Access-Control-Allow-Credentials", true);
	res.header("Access-Control-Expose-Headers", "Set-Cookie");

	next();
});

app.use("/assets", express.static("assets"));

app.use("/api/v1/", routes);

app.use((err, req, res, next) => {
	if (!err.output) {
		return res.status(500).json({
			statusCode: 500,
		});
	}
	return res.status(err.output.statusCode).json(err.output);
});

export default app;
