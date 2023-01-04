import express from "express";
import {
	forgetPassword,
	sendHtmlEmail,
	signin,
	signup,
	updateUserDetail,
	userDetail,
	verifyAccount,
} from "../../controllers/auth.controller";
import verifySignUp from "../../middleware/verifySignUp";
import authJwt from "../../middleware/authJwt";
import {
	aadhaarDownload,
	aadhaarGenerateOtp,
	aadhaarGetCaptcha,
} from "../../controllers/aadhaar.controller";
import { panVerify } from "../../controllers/pan.controller";

const router = express.Router();

router.post(
	"/register",
	[
		verifySignUp.checkDuplicateUsernameOrEmail,
		verifySignUp.checkPassword,
		verifySignUp.checkRolesExisted,
	],
	signup,
);
router.post("/login", signin);
router.get("/verifyAccount/:token", verifyAccount);
router.post("/forgetPassword", forgetPassword);
router.get("/userDetail", [authJwt.verifyToken], userDetail);
router.put("/updateUser", [authJwt.verifyToken], updateUserDetail);

router.post("/aadhaarGetCaptcha", [authJwt.verifyToken], aadhaarGetCaptcha);
router.post("/aadhaarGenerateOtp", [authJwt.verifyToken], aadhaarGenerateOtp);
router.post("/aadhaarDownload", [authJwt.verifyToken], aadhaarDownload);

router.post("/panVerify", [authJwt.verifyToken], panVerify);

// fake email test
router.post("/email", sendHtmlEmail);

export default router;
