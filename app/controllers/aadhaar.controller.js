import db from "../models";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const User = db.user;
const Aadhaar = db.aadhaar;

export async function aadhaarGetCaptcha(req, res) {
	const options = {
		method: "POST",
		url: `${process.env.AADHAAR_LINK}/PdfGetcaptcha`,
		headers: {
			"content-type": "application/json",
			"X-RapidAPI-Key": `${process.env.AADHAAR_API}`,
			"X-RapidAPI-Host": `${process.env.AADHAAR_HOST}`,
		},
		data: { langCode: "en", captchaLength: "3", captchaType: "2" },
	};

	await axios
		.request(options)
		.then((response) => {
			res.status(200).json({
				success: {
					data: response.data.Succeeded,
					message: "Captcha details attached.",
				},
			});
			return;
		})
		.catch((err) => {
			res.status(500).json({ error: err });
			return;
		});
}

export async function aadhaarGenerateOtp(req, res) {
	Aadhaar.find({
		uid: req.body.uidNumber,
	}).then((aadhaar) => console.log(aadhaar));

	const options = {
		method: "POST",
		url: `${process.env.AADHAAR_LINK}/Pdf_generate_aadhaar_otp`,
		headers: {
			"content-type": "application/json",
			"X-RapidAPI-Key": `${process.env.AADHAAR_API}`,
			"X-RapidAPI-Host": `${process.env.AADHAAR_HOST}`,
		},
		data: {
			method: "generateOTP",
			txn_id: "hd78-hdhhsg-y658dn",
			clientid: "222",
			uidNumber: req.body.uidNumber,
			captchaValue: req.body.captchaValue,
			captchaTxnId: req.body.captchaTxnId,
			consent: "Y",
		},
	};

	await axios
		.request(options)
		.then((response) => {
			res.status(200).json({
				success: {
					data: response.data.Succeeded,
					message: "OTP generation done successfully.",
				},
			});
			return;
		})
		.catch((err) => {
			res.status(500).json({ error: err });
			return;
		});
}

export function aadhaarDownload(req, res) {
	const options = {
		method: "POST",
		url: `${process.env.AADHAAR_LINK}/Pdf_aadhaar_download`,
		headers: {
			"content-type": "application/json",
			"X-RapidAPI-Key": `${process.env.AADHAAR_API}`,
			"X-RapidAPI-Host": `${process.env.AADHAAR_HOST}`,
		},
		data: {
			method: "downloadPDF",
			txn_id: "hd78-hdhhsg-y658dn",
			clientid: "222",
			uid: req.body.uid,
			mask: false,
			otp: req.body.otp,
			otpTxnId: req.body.otpTxnId,
			consent: "Y",
		},
	};

	axios
		.request(options)
		.then((response) => {
			const aadhaar = new Aadhaar({
				uid: req.body.uid,
				aadhaar_pdf: response.data.Succeeded.Data.data.aadhaarPdf,
			});

			aadhaar.save((err, aadhaar) => {
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

						aadhaar.user = user.map((user) => user._id);

						aadhaar.save((err, aadhaar) => {
							if (err) {
								res.status(500).json({ error: err });
								return;
							}

							res.status(200).json({
								success: {
									message: "Aadhaar Downloaded successfully.",
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
