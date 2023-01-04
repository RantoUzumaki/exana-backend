import { model, Schema } from "mongoose";

const Pan = model(
	"Pan",
	new Schema({
		first_name: String,
		last_name: String,
		middle_name: String,
		name_on_card: String,
		source: String,
		id_number: String,
		user: [
			{
				type: Schema.Types.ObjectId,
				ref: "User",
			},
		],
	}),
);

export default Pan;
