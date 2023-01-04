import db from "../models";
const ROLES = db.role;
const User = db.user;

const checkDuplicateUsernameOrEmail = (req, res, next) => {
	User.findOne({
		email: req.body.email,
	}).exec((err, user) => {
		if (err) {
			res.status(500).json({ error: err });
			return;
		}

		if (user) {
			res.status(401).json({ error: "Email already exist." });
			return;
		}

		next();
	});
};

const checkPassword = (req, res, next) => {
	const passformat =
		/^(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%^!&*+=]).*$/g;
	if (req.body.password) {
		if (req.body.password.length < 8) {
			res
				.status(401)
				.json({ error: "Password should be atleast 8 character length" });
			return;
		}

		if (req.body.password.match(passformat)) {
		} else {
			res.status(401).json({
				error:
					"Password should contain atleast 1 Capital, 1 Small, 1 Number and 1 Chracater",
			});
			return;
		}

		next();
	}
};

const checkRolesExisted = (req, res, next) => {
	if (req.body.roles) {
		for (let i = 0; i < req.body.roles.length; i++) {
			if (!ROLES.includes(req.body.roles[i])) {
				res.status(401).json({
					error: `Failed! Role ${req.body.roles[i]} does not exist!`,
				});
				return;
			}
		}
	}

	next();
};

const verifySignUp = {
	checkDuplicateUsernameOrEmail,
	checkPassword,
	checkRolesExisted,
};

export default verifySignUp;
