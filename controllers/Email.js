require('dotenv').config();

// const nodemailer = require('nodemailer');
const graph = require('./graph');

// let transporter = nodemailer.createTransport({
// 	host: 'smtp.office365.com',
// 	port: 587,
// 	secure: false,
// 	auth: {
// 		user: process.env.EMAIL_USER,
// 		pass: process.env.EMAIL_PASS,
// 	},
// 	tls: {
// 		ciphers: 'SSLv3',
// 	},
// });

module.exports = function (e, db) {
	var module = {};

	//  /api/syncUsers/:location/:tenant/:group
	module.sendInvite = async (request, response, next) => {
		try {
			var token = await graph.getToken();

			var email = request.query.email || '';
			var code = request.query.code || '';
			var name = request.query.name || '';

			if (code.trim().length !== 12) {
				response.status(500).send({ error: 'invalid code' });
			}

			if (name.trim().length === 0) {
				response.status(500).send({ error: 'invalid name' });
			}

			await graph
				.sendEmail(
					token,
					email,
					'Giftamizer Invitation',
					`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
					<html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" style="width: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; padding: 0; margin: 0">
						<head>
							<meta charset="UTF-8" />
							<meta content="width=device-width, initial-scale=1" name="viewport" />
							<meta content="telephone=no" name="format-detection" />
							<title>Giftamizer</title>
							<!--[if (mso 16)]>
								<style type="text/css">
									a {
										text-decoration: none;
									}
								</style>
							<![endif]-->
							<!--[if gte mso 9
								]><style>
									sup {
										font-size: 100% !important;
									}
								</style><!
							[endif]-->
							<!--[if gte mso 9]>
								<xml>
									<o:OfficeDocumentSettings>
										<o:AllowPNG></o:AllowPNG>
										<o:PixelsPerInch>96</o:PixelsPerInch>
									</o:OfficeDocumentSettings>
								</xml>
							<![endif]-->
							<style type="text/css">
								#outlook a {
									padding: 0;
								}
								.ExternalClass {
									width: 100%;
								}
								.ExternalClass,
								.ExternalClass p,
								.ExternalClass span,
								.ExternalClass font,
								.ExternalClass td,
								.ExternalClass div {
									line-height: 100%;
								}
								.es-button {
									mso-style-priority: 100 !important;
									text-decoration: none !important;
								}
								a[x-apple-data-detectors] {
									color: inherit !important;
									text-decoration: none !important;
									font-size: inherit !important;
									font-family: inherit !important;
									font-weight: inherit !important;
									line-height: inherit !important;
								}
								.es-desk-hidden {
									display: none;
									float: left;
									overflow: hidden;
									width: 0;
									max-height: 0;
									line-height: 0;
									mso-hide: all;
								}
								[data-ogsb] .es-button {
									border-width: 0 !important;
									padding: 10px 20px 10px 20px !important;
								}
								@media only screen and (max-width: 600px) {
									p,
									ul li,
									ol li,
									a {
										line-height: 150% !important;
									}
									h1,
									h2,
									h3,
									h1 a,
									h2 a,
									h3 a {
										line-height: 120% !important;
									}
									h1 {
										font-size: 30px !important;
										text-align: center;
									}
									h2 {
										font-size: 26px !important;
										text-align: center;
									}
									h3 {
										font-size: 20px !important;
										text-align: center;
									}
									.es-menu td a {
										font-size: 16px !important;
									}
									.es-header-body p,
									.es-header-body ul li,
									.es-header-body ol li,
									.es-header-body a {
										font-size: 16px !important;
									}
									.es-content-body p,
									.es-content-body ul li,
									.es-content-body ol li,
									.es-content-body a {
										font-size: 16px !important;
									}
									.es-footer-body p,
									.es-footer-body ul li,
									.es-footer-body ol li,
									.es-footer-body a {
										font-size: 16px !important;
									}
									.es-infoblock p,
									.es-infoblock ul li,
									.es-infoblock ol li,
									.es-infoblock a {
										font-size: 12px !important;
									}
									*[class='gmail-fix'] {
										display: none !important;
									}
									.es-m-txt-c {
										text-align: center !important;
									}
									.es-m-txt-r {
										text-align: right !important;
									}
									.es-m-txt-l {
										text-align: left !important;
									}
									.es-m-txt-r img,
									.es-m-txt-c img,
									.es-m-txt-l img {
										display: inline !important;
									}
									.es-button-border {
										display: block !important;
									}
									a.es-button,
									button.es-button {
										font-size: 20px !important;
										display: block !important;
										border-width: 10px 0px 10px 0px !important;
									}
									.es-btn-fw {
										border-width: 10px 0px !important;
										text-align: center !important;
									}
									.es-adaptive table,
									.es-btn-fw,
									.es-btn-fw-brdr,
									.es-left,
									.es-right {
										width: 100% !important;
									}
									.es-content table,
									.es-header table,
									.es-footer table,
									.es-content,
									.es-footer,
									.es-header {
										width: 100% !important;
										max-width: 600px !important;
									}
									.es-adapt-td {
										display: block !important;
										width: 100% !important;
									}
									.adapt-img {
										width: 100% !important;
										height: auto !important;
									}
									.es-m-p0 {
										padding: 0px !important;
									}
									.es-m-p0r {
										padding-right: 0px !important;
									}
									.es-m-p0l {
										padding-left: 0px !important;
									}
									.es-m-p0t {
										padding-top: 0px !important;
									}
									.es-m-p0b {
										padding-bottom: 0 !important;
									}
									.es-m-p20b {
										padding-bottom: 20px !important;
									}
									.es-mobile-hidden,
									.es-hidden {
										display: none !important;
									}
									tr.es-desk-hidden,
									td.es-desk-hidden,
									table.es-desk-hidden {
										width: auto !important;
										overflow: visible !important;
										float: none !important;
										max-height: inherit !important;
										line-height: inherit !important;
									}
									tr.es-desk-hidden {
										display: table-row !important;
									}
									table.es-desk-hidden {
										display: table !important;
									}
									td.es-desk-menu-hidden {
										display: table-cell !important;
									}
									.es-menu td {
										width: 1% !important;
									}
									table.es-table-not-adapt,
									.esd-block-html table {
										width: auto !important;
									}
									table.es-social td {
										display: inline-block !important;
									}
									table.es-social {
										display: inline-block !important;
									}
									.es-desk-hidden {
										display: table-row !important;
										width: auto !important;
										overflow: visible !important;
										max-height: inherit !important;
									}
									.h-auto {
										height: auto !important;
									}
								}
							</style>
						</head>
						<body style="width: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif; padding: 0; margin: 0">
							<div class="es-wrapper-color">
								<!--[if gte mso 9]>
									<v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
										<v:fill type="tile"></v:fill>
									</v:background>
								<![endif]-->
								<table
									class="es-wrapper"
									width="100%"
									cellspacing="0"
									cellpadding="0"
									style="
										mso-table-lspace: 0pt;
										mso-table-rspace: 0pt;
										border-collapse: collapse;
										border-spacing: 0px;
										padding: 0;
										margin: 0;
										width: 100%;
										height: 100%;
										background-repeat: repeat;
										background-position: center top;
									"
								>
									<tr style="border-collapse: collapse">
										<td valign="top" style="padding: 0; margin: 0">
											<table
												cellpadding="0"
												cellspacing="0"
												class="es-header"
												align="center"
												style="
													mso-table-lspace: 0pt;
													mso-table-rspace: 0pt;
													border-collapse: collapse;
													border-spacing: 0px;
													table-layout: fixed !important;
													width: 100%;
													background-color: transparent;
													background-repeat: repeat;
													background-position: center top;
												"
											>
												<tr style="border-collapse: collapse">
													<td align="center" style="padding: 0; margin: 0">
														<table
															class="es-header-body"
															align="center"
															cellspacing="0"
															cellpadding="0"
															style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px; background-color: #e9e9e9; width: 600px"
														>
															<tr style="border-collapse: collapse">
																<td style="padding: 0; margin: 0; background-color: #da2222" align="left" bgcolor="#da2222">
																	<table
																		width="100%"
																		cellspacing="0"
																		cellpadding="0"
																		style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px"
																	>
																		<tr style="border-collapse: collapse">
																			<td align="center" valign="top" style="padding: 0; margin: 0; width: 600px">
																				<table
																					width="100%"
																					cellspacing="0"
																					cellpadding="0"
																					role="presentation"
																					style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px"
																				>
																					<tr style="border-collapse: collapse">
																						<td align="center" style="padding: 0; margin: 0; padding-bottom: 5px; padding-top: 15px; font-size: 0px" bgcolor="#4caf50">
																							<table
																								width="100%"
																								height="100%"
																								cellspacing="0"
																								cellpadding="0"
																								border="0"
																								role="presentation"
																								style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px"
																							>
																								<tr style="border-collapse: collapse">
																									<td style="padding: 0; margin: 0; border-bottom: 1px solid #4caf50; height: 1px; width: 100%; margin: 0px"></td>
																								</tr>
																							</table>
																						</td>
																					</tr>
																				</table>
																			</td>
																		</tr>
																	</table>
																</td>
															</tr>
															<tr style="border-collapse: collapse">
																<td align="left" style="padding: 10px; margin: 0">
																	<!--[if mso]><table style="width:580px" cellpadding="0" cellspacing="0"><tr><td style="width:86px" valign="top"><![endif]-->
																	<table
																		class="es-left"
																		align="left"
																		cellspacing="0"
																		cellpadding="0"
																		style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px; float: left"
																	>
																		<tr style="border-collapse: collapse">
																			<td class="es-m-p0r" align="center" valign="top" style="padding: 0; margin: 0; width: 66px">
																				<table
																					width="100%"
																					cellspacing="0"
																					cellpadding="0"
																					role="presentation"
																					style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px"
																				>
																					<tr style="border-collapse: collapse">
																						<td class="es-m-p0l" align="left" style="padding: 0; margin: 0; padding-left: 15px; font-size: 0px">
																							<a
																								href="https://giftamizer.com/"
																								target="_blank"
																								style="
																									-webkit-text-size-adjust: none;
																									-ms-text-size-adjust: none;
																									mso-line-height-rule: exactly;
																									text-decoration: underline;
																									color: #999999;
																									font-size: 14px;
																								"
																								><img
																									src="https://giftamizer.com/android-chrome-512x512.png"
																									alt="Smart home logo"
																									title="Smart home logo"
																									width="51"
																									style="display: block; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic"
																							/></a>
																						</td>
																					</tr>
																				</table>
																			</td>
																			<td class="es-hidden" style="padding: 0; margin: 0; width: 20px"></td>
																		</tr>
																	</table>
																	<!--[if mso]></td><td style="width:329px" valign="top"><![endif]-->
																	<table
																		align="left"
																		cellspacing="0"
																		cellpadding="0"
																		class="es-left"
																		style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px; float: left"
																	>
																		<tr style="border-collapse: collapse">
																			<td align="left" style="padding: 0; margin: 0; width: 329px">
																				<table
																					width="100%"
																					cellspacing="0"
																					cellpadding="0"
																					role="presentation"
																					style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px"
																				>
																					<tr style="border-collapse: collapse">
																						<td align="left" style="padding: 0; margin: 0; padding-top: 10px">
																							<p
																								style="
																									margin: 0;
																									-webkit-text-size-adjust: none;
																									-ms-text-size-adjust: none;
																									mso-line-height-rule: exactly;
																									font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif;
																									line-height: 34px;
																									color: #000000;
																									font-size: 28px;
																								"
																							>
																								<strong>Giftamizer</strong>
																							</p>
																						</td>
																					</tr>
																				</table>
																			</td>
																		</tr>
																	</table>
																	<!--[if mso]></td><td style="width:20px"></td><td style="width:145px" valign="top"><![endif]-->
																	<table
																		cellpadding="0"
																		cellspacing="0"
																		class="es-right"
																		align="right"
																		style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px; float: right"
																	>
																		<tr style="border-collapse: collapse">
																			<td align="left" style="padding: 0; margin: 0; width: 145px">
																				<table
																					cellpadding="0"
																					cellspacing="0"
																					width="100%"
																					role="presentation"
																					style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px"
																				>
																					<tr style="border-collapse: collapse">
																						<td style="padding: 0; margin: 0">
																							<table
																								class="es-menu"
																								width="100%"
																								cellspacing="0"
																								cellpadding="0"
																								role="presentation"
																								style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px"
																							>
																								<tr class="links" style="border-collapse: collapse">
																									<td
																										style="margin: 0; padding-left: 5px; padding-right: 5px; padding-top: 22px; padding-bottom: 20px; border: 0"
																										align="center"
																										width="50%"
																										bgcolor="transparent"
																									>
																										<a
																											style="
																												-webkit-text-size-adjust: none;
																												-ms-text-size-adjust: none;
																												mso-line-height-rule: exactly;
																												text-decoration: none;
																												display: block;
																												font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif;
																												color: #333333;
																												font-size: 14px;
																											"
																											href="https://giftamizer.com/signup"
																											target="_blank"
																											>Sign up</a
																										>
																									</td>
																									<td
																										style="margin: 0; padding-left: 5px; padding-right: 5px; padding-top: 22px; padding-bottom: 20px; border: 0"
																										align="center"
																										width="50%"
																										bgcolor="transparent"
																									>
																										<a
																											style="
																												-webkit-text-size-adjust: none;
																												-ms-text-size-adjust: none;
																												mso-line-height-rule: exactly;
																												text-decoration: none;
																												display: block;
																												font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif;
																												color: #333333;
																												font-size: 14px;
																											"
																											href="https://giftamizer.com/signin"
																											target="_blank"
																											>Login</a
																										>
																									</td>
																								</tr>
																							</table>
																						</td>
																					</tr>
																				</table>
																			</td>
																		</tr>
																	</table>
																	<!--[if mso]></td></tr></table><![endif]-->
																</td>
															</tr>
														</table>
													</td>
												</tr>
											</table>
											<table
												class="es-content"
												cellspacing="0"
												cellpadding="0"
												align="center"
												style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px; table-layout: fixed !important; width: 100%"
											>
												<tr style="border-collapse: collapse">
													<td align="center" style="padding: 0; margin: 0">
														<table
															class="es-content-body"
															style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px; background-color: #4caf50; width: 600px"
															cellspacing="0"
															cellpadding="0"
															bgcolor="#4caf50"
															align="center"
														>
															<tr style="border-collapse: collapse">
																<td align="left" style="padding: 0; margin: 0">
																	<table
																		width="100%"
																		cellspacing="0"
																		cellpadding="0"
																		style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px"
																	>
																		<tr style="border-collapse: collapse">
																			<td valign="top" align="center" style="padding: 0; margin: 0; width: 600px">
																				<table
																					style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px; border-radius: 0px"
																					width="100%"
																					cellspacing="0"
																					cellpadding="0"
																					role="presentation"
																				>
																					<tr style="border-collapse: collapse">
																						<td align="center" style="padding: 0; margin: 0; padding-top: 20px; padding-left: 20px; padding-right: 20px">
																							<h3
																								style="
																									margin: 0;
																									line-height: 36px;
																									mso-line-height-rule: exactly;
																									font-family: 'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;
																									font-size: 24px;
																									font-style: normal;
																									font-weight: normal;
																									color: #ffffff;
																								"
																							>
																								${name} has invited you <br />to join a group on Giftamizer!<br />
																							</h3>
																							<h3
																								style="
																									margin: 0;
																									line-height: 27px;
																									mso-line-height-rule: exactly;
																									font-family: 'trebuchet ms', 'lucida grande', 'lucida sans unicode', 'lucida sans', tahoma, sans-serif;
																									font-size: 18px;
																									font-style: normal;
																									font-weight: normal;
																									color: #ffffff;
																								"
																							>
																								Invite Code: ${code}
																							</h3>
																						</td>
																					</tr>
																					<tr style="border-collapse: collapse">
																						<td align="center" style="margin: 0; padding-left: 10px; padding-right: 10px; padding-bottom: 15px; padding-top: 30px">
																							<!--[if mso
																								]><a href="https://giftamizer.com/" target="_blank" hidden>
																									<v:roundrect
																										xmlns:v="urn:schemas-microsoft-com:vml"
																										xmlns:w="urn:schemas-microsoft-com:office:word"
																										esdevVmlButton
																										href="https://giftamizer.com/"
																										style="height: 41px; v-text-anchor: middle; width: 74px"
																										arcsize="0%"
																										stroke="f"
																										fillcolor="#ffffff"
																									>
																										<w:anchorlock></w:anchorlock>
																										<center
																											style="
																												color: #da2222;
																												font-family: arial, 'helvetica neue', helvetica, 'sans-serif';
																												font-size: 15px;
																												font-weight: 400;
																												line-height: 15px;
																												mso-text-raise: 1px;
																											"
																										>
																											Join
																										</center>
																									</v:roundrect></a
																								> <!
																							[endif]--><!--[if !mso]><!-- --><span
																								class="msohide es-button-border"
																								style="
																									border-style: solid;
																									border-color: #da2222;
																									background: #2cb543;
																									border-width: 0px;
																									display: inline-block;
																									border-radius: 0px;
																									width: auto;
																									mso-hide: all;
																								"
																								><a
																									href="https://giftamizer.com/"
																									class="es-button"
																									target="_blank"
																									style="
																										mso-style-priority: 100 !important;
																										text-decoration: none;
																										-webkit-text-size-adjust: none;
																										-ms-text-size-adjust: none;
																										mso-line-height-rule: exactly;
																										color: #da2222;
																										font-size: 18px;
																										border-style: solid;
																										border-color: #ffffff;
																										border-width: 10px 20px 10px 20px;
																										display: inline-block;
																										background: #ffffff;
																										border-radius: 0px;
																										font-family: arial, 'helvetica neue', helvetica, sans-serif;
																										font-weight: normal;
																										font-style: normal;
																										line-height: 22px;
																										width: auto;
																										text-align: center;
																									"
																									>Join</a
																								></span
																							><!--<![endif]-->
																						</td>
																					</tr>
																				</table>
																			</td>
																		</tr>
																	</table>
																</td>
															</tr>
														</table>
													</td>
												</tr>
											</table>
										</td>
									</tr>
								</table>
							</div>
						</body>
					</html>`
				)
				.then((res) => {
					if (res.status !== 202) {
						console.log(res);
						response.status(500).send({ error: res.message });
					} else {
						response.send({ result: 'ok' });
					}
				})
				.catch((err) => {
					console.log(err);
					response.status(500).send({ error: err });
				});
		} catch (error) {
			console.log(error);
			response.status(500).send({ error: error });
		}
	};
	return module;
};
