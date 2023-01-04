import { model, Schema } from "mongoose";

const User = model(
	"User",
	new Schema({
		firstname: String,
		lastname: String,
		email: String,
		password: String,
		countryCode: String,
		phoneNumber: Number,
		verified: {
			type: Boolean,
			default: false,
		},
		token: String,
		address1: String,
		address2: String,
		city: String,
		district: String,
		state: String,
		country: String,
		pincode: Number,
		roles: [
			{
				type: Schema.Types.ObjectId,
				ref: "Role",
			},
		],
	}),
);

export default User;
