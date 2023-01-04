import { model, Schema } from "mongoose";

const Aadhaar = model(
	"Aadhaar",
	new Schema({
		uid: Number,
		aadhaar_pdf: String,
		user: [
			{
				type: Schema.Types.ObjectId,
				ref: "User",
			},
		],
	}),
);

export default Aadhaar;
