import { secret } from "../config/auth.config";
import db from "../models";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";
import { sendEmail } from "../libs/mail";
import path from "path";
import handlebars from "handlebars";
import fs from "fs";
import { generatePassword } from "../libs/random_password";

dotenv.config();

const User = db.user;
const Role = db.role;
const Aadhaar = db.aadhaar;
const Pan = db.pan;

export function signup(req, res) {
	const token = crypto
		.createHash("md5")
		.update(Math.random().toString().substring(2))
		.digest("hex");

	const user = new User({
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		email: req.body.email,
		password: bcrypt.hashSync(req.body.password, 8),
		token: token,
	});

	user.save((err, user) => {
		if (err) {
			res.status(500).json({ error: err });
			return;
		}

		Role.find(
			{
				name: { $in: "user" },
			},
			(err, roles) => {
				if (err) {
					res.status(500).json({ error: err });
					return;
				}

				user.roles = roles.map((role) => role._id);
				user.save((err) => {
					if (err) {
						res.status(500).json({ error: err });
						return;
					}
				});

				const protocol = req.protocol;
				const host = req.hostname;
				const url = "/api/v1/verifyAccount";
				const port = 8080;
				const fullUrl = `${protocol}://${host}:${port}${url}/${token}`;

				const filePath = path.dirname("");

				const source = fs
					.readFileSync(
						path.join(filePath, "html/account_created/index.html"),
						"utf-8",
					)
					.toString();
				const template = handlebars.compile(source);
				const replacements = {
					imgUrl: `${protocol}://${host}:${port}/assets/logo.png`,
					username: req.body.firstname,
					fullurl: fullUrl,
				};
				const htmlToSend = template(replacements);

				const mailOptions = {
					from: process.env.MAIL_ID,
					to: req.body.email,
					subject: "Welcome to EXANA.",
					html: htmlToSend,
				};

				sendEmail(mailOptions);

				res.status(201).json({
					success: {
						email: req.body.email,
						message: "Email has been sent to your to verify.",
					},
				});
				return;
			},
		);
	});
}

export function signin(req, res) {
	User.findOne({
		email: req.body.email,
	})
		.populate("roles", "-__v")
		.exec((err, email) => {
			if (err) {
				res.status(500).json({ error: err });
				return;
			}

			if (!email) {
				res.status(401).json({ error: "Email not found." });
				return;
			}

			if (!email.verified) {
				res.status(401).json({ error: "Please verify yout email." });
				return;
			}

			var passwordIsValid = bcrypt.compareSync(
				req.body.password,
				email.password,
			);

			if (!passwordIsValid) {
				res.status(401).json({ error: "Wrong Password." });
				return;
			}

			var token = jwt.sign({ id: email.id }, secret, {
				expiresIn: 86400, // 24 hours
			});

			var authorities = [];

			for (let i = 0; i < email.roles.length; i++) {
				authorities.push("ROLE_" + email.roles[i].name.toUpperCase());
			}

			res.status(200).json({
				success: {
					roles: authorities,
					accessToken: token,
					data: {
						email: email.email,
						firstName: email.firstname,
						lastName: email.lastname,
					},
					message: "Successfully signed in",
				},
			});
			return;
		});
}

export function verifyAccount(req, res) {
	const { token } = req.params;

	User.findOne({
		token: token,
	}).exec((err, user) => {
		res.setHeader("Content-type", "text/html");

		if (user.verified) {
			res.write(
				`<style>
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;800&display=swap');

          body {
            font-family: 'Poppins', sans-serif;
          }

          .checkmark__circle {
            stroke-dasharray: 166;
            stroke-dashoffset: 166;
            stroke-width: 2;
            stroke-miterlimit: 10;
            stroke: #7ac142;
            fill: none;
            animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
          }
          
          .checkmark {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            display: block;
            stroke-width: 2;
            stroke: #fff;
            stroke-miterlimit: 10;
            margin: 10% auto;
            box-shadow: inset 0px 0px 0px #7ac142;
            animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
          }
          
          .checkmark__check {
            transform-origin: 50% 50%;
            stroke-dasharray: 48;
            stroke-dashoffset: 48;
            animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
          }
          
          @keyframes stroke {
            100% {
              stroke-dashoffset: 0;
            }
          }
          @keyframes scale {
            0%, 100% {
              transform: none;
            }
            50% {
              transform: scale3d(1.1, 1.1, 1);
            }
          }
          @keyframes fill {
            100% {
              box-shadow: inset 0px 0px 0px 30px #7ac142;
            }
          }      
        </style>
        <div style="display: flex; width: 100%; height: 100%; justify-content: center; align-items: center; background: #f9fbfe">
          <div style="width: 550px; height: 450px; text-align: center; box-shadow: 0 0 10px 2px rgba(0,0,0,0.1); background: #fff; border-radius: 8px">
            <div style="height: 100%;padding: 18px; display: flex; flex-direction: column; justify-content: center">
              <span style="font-size: 20px">Welcome to <span style="font-size: 24px; font-weight: bolder; color: #4c76e2">EXANA</span></span>
              <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
              <span style="margin-top: 18px; font-size: 20px; color: #0575E6">Your account has been already verified. Please Login</span>
            </div>
          </div>
        </div>
        <script>
          setTimeout(() => {
            window.close()
          }, 6000)
        </script>`,
			);

			return;
		}

		user.verified = true;
		user.token = "";
		user.save();

		res.write(
			`<style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;800&display=swap');

        body {
          font-family: 'Poppins', sans-serif;
        }

        .checkmark__circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          stroke-width: 2;
          stroke-miterlimit: 10;
          stroke: #7ac142;
          fill: none;
          animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        
        .checkmark {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: block;
          stroke-width: 2;
          stroke: #fff;
          stroke-miterlimit: 10;
          margin: 10% auto;
          box-shadow: inset 0px 0px 0px #7ac142;
          animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
        }
        
        .checkmark__check {
          transform-origin: 50% 50%;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
        }
        
        @keyframes stroke {
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes scale {
          0%, 100% {
            transform: none;
          }
          50% {
            transform: scale3d(1.1, 1.1, 1);
          }
        }
        @keyframes fill {
          100% {
            box-shadow: inset 0px 0px 0px 30px #7ac142;
          }
        }      
      </style>
      <div style="display: flex; width: 100%; height: 100%; justify-content: center; align-items: center; background: #f9fbfe">
        <div style="width: 550px; height: 450px; text-align: center; box-shadow: 0 0 10px 2px rgba(0,0,0,0.1); background: #fff; border-radius: 8px">
          <div style="height: 100%;padding: 18px; display: flex; flex-direction: column; justify-content: center">
            <span style="font-size: 20px">Welcome to <span style="font-size: 24px; font-weight: bolder; color: #4c76e2">EXANA</span></span>
            <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
            <span style="margin-top: 18px; font-size: 20px; color: #0575E6">Your account has been verified successfully.</span>
          </div>
        </div>
      </div>
      <script>
        setTimeout(() => {
          window.close()
        }, 6000)
      </script>`,
		);

		return;
	});
}

export function forgetPassword(req, res) {
	User.findOne({
		email: req.body.email,
	}).exec((err, email) => {
		if (err) {
			res.status(500).json({ error: err });
			return;
		}

		if (!email) {
			res.status(401).json({ error: "Email not found." });
			return;
		}

		let pass = generatePassword();
		email.password = bcrypt.hashSync(pass, 8);
		email.save();

		const filePath = path.dirname("");
		const protocol = req.protocol;
		const host = req.hostname;
		const port = 8080;

		const source = fs
			.readFileSync(
				path.join(filePath, "html/forget_password/index.html"),
				"utf-8",
			)
			.toString();
		const template = handlebars.compile(source);
		const replacements = {
			imgUrl: `${protocol}://${host}:${port}/assets/logo.png`,
			username: email.firstname,
			password: pass,
		};
		const htmlToSend = template(replacements);

		const mailOptions = {
			from: process.env.MAIL_ID,
			to: req.body.email,
			subject: "Forget your password?.",
			html: htmlToSend,
		};

		sendEmail(mailOptions);

		res.status(201).json({ success: "Check email for temperory password" });
		return;
	});
}

export function userDetail(req, res) {
	User.findOne({
		_id: req.userId,
	})
		.populate("roles", "-__v")
		.exec((err, user) => {
			if (err) {
				res.status(500).json({ error: err });
				return;
			}

			let authorities = [];

			for (let i = 0; i < user.roles.length; i++) {
				authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
			}

			let aadhaarDetails = {
				data: null,
				message: "",
			};

			Aadhaar.find({
				user: req.userId,
			}).then((aadhaar) => {
				if (!aadhaar) {
					aadhaarDetails.data = null;
				} else {
					aadhaarDetails.data = aadhaar;
				}
			});

			res.status(200).json({
				success: {
					roles: authorities,
					data: {
						firstName: user.firstname || "",
						lastName: user.lastname || "",
						email: user.email,
						password: "",
						address1: user.address1 || "",
						address2: user.address2 || "",
						city: user.city || "",
						district: user.district || "",
						state: user.state || "",
						country: user.country || "",
						pincode: user.pincode || "",
					},
				},
			});
			return;
		});
}

export function updateUserDetail(req, res) {
	const data = {
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		countryCode: req.body.countryCode,
		phoneNumber: req.body.phoneNumber,
		address1: req.body.address1,
		address2: req.body.address2,
		city: req.body.city,
		district: req.body.district,
		state: req.body.state,
		country: req.body.country,
		pincode: req.body.pincode,
	};
	console.log(data);

	User.findOneAndUpdate(
		{
			_id: req.userId,
		},
		data,
	)
		.then(() => {
			res.status(201).json({
				success: {
					message: "Details has been updated successfully.",
				},
			});
			return;
		})
		.catch((err) => {
			res.status(500).json({ error: err });
			return;
		});
}

export function sendHtmlEmail(req, res) {
	const filePath = path.dirname("");
	const protocol = req.protocol;
	const host = req.hostname;
	const port = 8080;

	const source = fs
		.readFileSync(path.join(filePath, "html/email.html"), "utf-8")
		.toString();

	const template = handlebars.compile(source);

	const replacements = {
		// logoUrl: `${protocol}://${host}:${port}/assets/logo.png`,
		// emj1: `${protocol}://${host}:${port}/assets/01-emj.png`,
		// emj2: `${protocol}://${host}:${port}/assets/02-emj.png`,
		// emj3: `${protocol}://${host}:${port}/assets/03-emj.png`,
		// emj4: `${protocol}://${host}:${port}/assets/04-emj.png`,
		// emj5: `${protocol}://${host}:${port}/assets/05-emj.png`,
		// star: `${protocol}://${host}:${port}/assets/star.png`,
		username: "Ranto",
	};

	const htmlToSend = template(replacements);
	const mailOptions = {
		from: process.env.MAIL_ID,
		to: req.body.email,
		subject: "Forget your password?.",
		html: htmlToSend,
	};

	sendEmail(mailOptions);

	res.status(201).json({ success: "Check email for temperory password" });
	return;
}
