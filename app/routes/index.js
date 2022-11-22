import express from "express";
import auth from "./auth/auth";

const router = express.Router();

router.use("/", auth);

export default router;
