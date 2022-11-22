import express from "express";
import {
  signin,
  signup,
  verifyAccount,
} from "../../controllers/auth.controller";
import verifySignUp from "../../middleware/verifySignUp";

const router = express.Router();

router.post(
  "/register",
  [
    verifySignUp.checkDuplicateUsernameOrEmail,
    verifySignUp.checkPassword,
    verifySignUp.checkRolesExisted,
  ],
  signup
);

router.post("/login", signin);

router.get("/verifyAccount/:token", verifyAccount);

export default router;
