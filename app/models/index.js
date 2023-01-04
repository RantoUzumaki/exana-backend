import mongoose from "mongoose";
import Role from "./role.model";
import User from "./user.model";
import Aadhaar from "./aadhaar.model";
import Pan from "./pan.model";

const db = {};

db.mongoose = mongoose;
db.role = Role;
db.user = User;
db.aadhaar = Aadhaar;
db.pan = Pan;

db.ROLES = ["user", "admin"];

export default db;
