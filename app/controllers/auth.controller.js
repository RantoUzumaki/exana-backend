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
      res.internalServerError(err);
      return;
    }

    Role.find(
      {
        name: { $in: "user" },
      },
      (err, roles) => {
        if (err) {
          res.internalServerError(err);
          return;
        }

        user.roles = roles.map((role) => role._id);
        user.save((err) => {
          if (err) {
            res.internalServerError(err);
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
            "utf-8"
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

        res.created(req.body.email, `Email has been sent to your to verify.`);
      }
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
        res.status(500).send({ message: err });
        return;
      }
      console.log(email);

      if (!email) {
        return res.status(404).send({ message: "email Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        email.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!",
        });
      }

      var token = jwt.sign({ id: email.id }, secret, {
        expiresIn: 86400, // 24 hours
      });

      // var authorities = [];

      // for (let i = 0; i < email.roles.length; i++) {
      //   authorities.push("ROLE_" + email.roles[i].name.toUpperCase());
      // }

      res.status(200).send({
        id: email._id,
        firstname: email.firstname,
        lastname: email.lastname,
        email: email.email,
        // roles: authorities,
        accessToken: token,
      });
    });
}

export function verifyAccount(req, res) {
  const { token } = req.params;

  User.findOne({
    token: token,
  }).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }
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
        </script>`
      );

      return;
    }

    user.verified = true;
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
      </script>`
    );

    return;
  });
}

export function forgetPassword(req, res) {
  User.findOne({
    email: req.body.email,
  }).exec((err, email) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (!email) {
      return res.status(404).send({ message: "email Not found." });
    }

    if (!email.verified) {
      return res
        .status(404)
        .send({ message: "Please verify your account first." });
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
        "utf-8"
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

    res.created(req.body.email, `Email has been sent to your to verify.`);
  });
}
