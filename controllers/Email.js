const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
	host: 'smtp.office365.com',
	port: 587,
	secure: false,
	auth: {
		user: 'noreply@giftamizer.com',
		pass: '***REMOVED***',
	},
	tls: {
		ciphers: 'SSLv3',
	},
});

module.exports = function (e, db) {
	var module = {};

	//  /api/syncUsers/:location/:tenant/:group
	module.sendInvite = async (request, response, next) => {
		try {
			var email = request.query.email || '';
			var code = request.query.code || '';
			var name = request.query.name || '';

			if (code.trim().length !== 12) {
				response.status(500).send({ error: 'invalid code' });
			}

			if (name.trim().length === 0) {
				response.status(500).send({ error: 'invalid name' });
			}

			let info = await transporter.sendMail({
				from: 'Giftamizer <noreply@giftamizer.com>',
				to: email, // list of receivers
				subject: 'Giftamizer Invitation',
				html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
					<!-- saved from url=(0046)file:///C:/Users/evan/Downloads/Christmas.html -->
					<html
						xmlns="http://www.w3.org/1999/xhtml"
						xmlns:o="urn:schemas-microsoft-com:office:office"
						style="width:100%;font-family:helvetica, &#39;helvetica neue&#39;, arial, verdana, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0"
					>
						<head>
							<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
					
							<meta http-equiv="Content-Security-Policy" content="script-src &#39;none&#39;; connect-src &#39;none&#39;; object-src &#39;none&#39;; form-action &#39;none&#39;;" />
					
							<meta content="width=device-width, initial-scale=1" name="viewport" />
							<meta content="telephone=no" name="format-detection" />
							<title>Giftamizer Invitation</title>
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
							<link rel="shortcut icon" type="image/png" href="https://stripo.email/assets/img/favicon.png" />
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
								@media only screen and (max-width: 600px) {
									p,
									ul li,
									ol li,
									a {
										font-size: 16px !important;
										line-height: 150% !important;
									}
									h1 {
										font-size: 30px !important;
										text-align: center;
										line-height: 120% !important;
									}
									h2 {
										font-size: 26px !important;
										text-align: center;
										line-height: 120% !important;
									}
									h3 {
										font-size: 20px !important;
										text-align: center;
										line-height: 120% !important;
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
									a.es-button {
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
								}
							</style>
							<meta property="og:title" content="Giftamizer Invitation" />
							<meta
								property="og:description"
								content="Want to receive gifts that you know you will love? Giftamizer is the perfect answer. It’s your very own personal gift registry. Whether you’re online or in-store, you can add anything you’d like to receive – from your favourite bottle of wine or perfect pair of shoes to a new mountain bike or weekend away. Share with your friends or family and invite them to share with you! <i>Gift Giving just got a whole lot better."
							/>
						</head>
						<body style="width:100%;height:100%;font-family:helvetica, &#39;helvetica neue&#39;, arial, verdana, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
							<div class="es-wrapper-color">
								<!--[if gte mso 9]>
									<v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
										<v:fill type="tile" color="#cccccc"></v:fill>
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
									<tbody>
										<tr style="border-collapse: collapse">
											<td valign="top" style="padding: 0; margin: 0">
												<table
													class="es-content"
													cellspacing="0"
													cellpadding="0"
													align="center"
													style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px; table-layout: fixed !important; width: 100%"
												>
													<tbody>
														<tr style="border-collapse: collapse">
															<td align="center" style="padding: 0; margin: 0">
																<table
																	class="es-content-body"
																	style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px; background-color: #da2222; width: 600px"
																	cellspacing="0"
																	cellpadding="0"
																	bgcolor="#da2222"
																	align="center"
																>
																	<tbody>
																		<tr style="border-collapse: collapse">
																			<td align="left" style="padding: 0; margin: 0">
																				<table
																					width="100%"
																					cellspacing="0"
																					cellpadding="0"
																					style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px"
																				>
																					<tbody>
																						<tr style="border-collapse: collapse">
																							<td valign="top" align="center" style="padding: 0; margin: 0; width: 600px">
																								<table
																									style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; border-spacing: 0px; border-radius: 0px"
																									width="100%"
																									cellspacing="0"
																									cellpadding="0"
																								>
																									<tbody>
																										<tr style="border-collapse: collapse">
																											<td align="center" style="padding: 0; margin: 0; font-size: 0">
																												<a
																													target="_blank"
																													href="https://viewstripo.email/"
																													style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, &#39;helvetica neue&#39;, arial, verdana, sans-serif;font-size:14px;text-decoration:underline;color:#FFFFFF"
																													><img
																														class="adapt-img"
																														src="./Christmas_files/51511512136382071.jpg"
																														alt=""
																														style="
																															display: block;
																															border: 0;
																															outline: none;
																															text-decoration: none;
																															-ms-interpolation-mode: bicubic;
																															width: 600px;
																														"
																														width="600"
																												/></a>
																											</td>
																										</tr>
					
																										<tr style="border-collapse: collapse">
																											<td align="center" style="padding: 0; margin: 0; padding-top: 20px; padding-left: 20px; padding-right: 20px">
																												<h3
																													style="Margin:0;line-height:36px;mso-line-height-rule:exactly;font-family:&#39;trebuchet ms&#39;, &#39;lucida grande&#39;, &#39;lucida sans unicode&#39;, &#39;lucida sans&#39;, tahoma, sans-serif;font-size:24px;font-style:normal;font-weight:normal;color:#FFFFFF"
																												>
																													${name} has invited you to join a group on Giftazmizer!
																												</h3>
																												<h3
																													style="Margin:0;line-height:27px;mso-line-height-rule:exactly;font-family:&#39;trebuchet ms&#39;, &#39;lucida grande&#39;, &#39;lucida sans unicode&#39;, &#39;lucida sans&#39;, tahoma, sans-serif;font-size:18px;font-style:normal;font-weight:normal;color:#FFFFFF"
																												>
																													Invite Code: ${code}
																												</h3>
																											</td>
																										</tr>
																										<tr style="border-collapse: collapse">
																											<td align="center" style="padding: 0; margin: 0; padding-left: 10px; padding-right: 10px; padding-top: 30px">
																												<span
																													class="es-button-border"
																													style="
																														border-style: solid;
																														border-color: #da2222;
																														background: #2cb543;
																														border-width: 0px;
																														display: inline-block;
																														border-radius: 0px;
																														width: auto;
																													"
																													><a
																														href="https://giftamizer.com"
																														class="es-button"
																														target="_blank"
																														style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, &#39;helvetica neue&#39;, helvetica, sans-serif;font-size:18px;color:#DA2222;border-style:solid;border-color:#FFFFFF;border-width:10px 20px 10px 20px;display:inline-block;background:#FFFFFF;border-radius:0px;font-weight:normal;font-style:normal;line-height:22px;width:auto;text-align:center"
																														>Join</a
																													></span
																												>
																											</td>
																										</tr>
																										<tr style="border-collapse: collapse">
																											<td align="center" style="padding: 0; margin: 0; font-size: 0">
																												<img
																													class="adapt-img"
																													src="./Christmas_files/15081512133896902.jpg"
																													alt=""
																													width="600"
																													style="display: block; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic"
																												/>
																											</td>
																										</tr>
																									</tbody>
																								</table>
																							</td>
																						</tr>
																					</tbody>
																				</table>
																			</td>
																		</tr>
																	</tbody>
																</table>
															</td>
														</tr>
													</tbody>
												</table>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</body>
					</html>
					`,
			});

			console.log('invite sent: ' + info.messageId);

			response.send({ result: info.messageId });
		} catch (error) {
			console.log(error);
			response.status(500).send({ error: 'error' });
		}
	};
	return module;
};
