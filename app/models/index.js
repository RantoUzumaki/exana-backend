import mongoose from "mongoose";
import Role from "./role.model";
import User from "./user.model";

const db = {};

db.mongoose = mongoose;
db.role = Role;
db.user = User;

db.ROLES = ["user", "admin"];

export default db;
