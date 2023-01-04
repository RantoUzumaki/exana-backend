import db from "../models";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const User = db.user;
const Pan = db.pan;

export async function panVerify(req, res) {
	const options = {
		method: "POST",
		url: process.env.PAN_LINK,
		headers: {
			"content-type": "application/json",
			"X-RapidAPI-Key": `${process.env.PAN_API}`,
			"X-RapidAPI-Host": `${process.env.PAN_HOST}`,
		},
		data: {
			task_id: process.env.PAN_TASK_ID,
			group_id: process.env.PAN_GROUP_ID,
			data: {
				id_number: req.body.panNumber,
			},
		},
	};

	await axios
		.request(options)
		.then((response) => {
			const pan = new Pan({
				first_name: response.data.result.source_output.first_name,
				last_name: response.data.result.source_output.last_name,
				middle_name: response.data.result.source_output.middle_name,
				name_on_card: response.data.result.source_output.name_on_card,
				source: response.data.result.source_output.source,
				id_number: response.data.result.source_output.id_number,
			});

			pan.save((err, pan) => {
				if (err) {
					res.status(500).json({ error: err });
					return;
				}

				User.find(
					{
						_id: { $in: req.userId },
					},
					(err, user) => {
						if (err) {
							res.status(500).json({ error: err });
							return;
						}

						pan.user = user.map((user) => user._id);

						pan.save((err, pan) => {
							if (err) {
								res.status(500).json({ error: err });
								return;
							}

							res.status(200).json({
								success: {
									message: "Pan Verified.",
								},
							});
							return;
						});
					},
				);
			});
		})
		.catch((err) => {
			res.status(500).json({ error: err });
			return;
		});
}
