import jwt from "jsonwebtoken";
import { secret } from "../config/auth.config.js";
import db from "../models";

const User = db.user;
const Role = db.role;

const verifyToken = (req, res, next) => {
	let token = req.headers["x-access-token"];

	if (!token) {
		res.status(403).json({ error: "No token provided" });
		return;
	}

	jwt.verify(token, secret, (err, decoded) => {
		if (err) {
			res.status(401).json({ error: err });
			return;
		}

		req.userId = decoded.id;
		next();
	});
};

const isAdmin = (req, res, next) => {
	User.findById(req.userId).exec((err, user) => {
		if (err) {
			res.status(500).json({ error: err });
			return;
		}

		Role.find(
			{
				_id: { $in: user.roles },
			},
			(err, roles) => {
				if (err) {
					res.status(500).json({ error: err });
					return;
				}

				for (let i = 0; i < roles.length; i++) {
					if (roles[i].name === "admin") {
						next();
						return;
					}
				}

				res.status(403).json({ error: "Required Admin Role." });
				return;
			},
		);
	});
};

const authJwt = {
	verifyToken,
	isAdmin,
};

export default authJwt;
