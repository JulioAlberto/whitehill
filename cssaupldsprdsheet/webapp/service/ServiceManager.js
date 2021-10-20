sap.ui.define([
		'sap/ui/base/ManagedObject',
		'sap/m/MessageToast',
		'cssa/sp/cssaupldsprdsheet/util/Utils',
	],
	function (MObj, Toast, Utils) {

		// ctlr: null,
		var i18nResourceBundle;
		return {

			// getCsrfToken: function () {
			// 	// Get a CSRF token from the server and load into the model for future use	
			// 	var url = "https://cssa-erp-dev.cssalliance.ca/sap/bc/rest/zcssaapi/csrf/?sap-client=030";
			// 	var data = '';
			// 	// var data = dta;
			// 	$.ajax({
			// 		type: "OPTIONS",
			// 		url: url,
			// 		contentType: 'application/json',
			// 		crossDomain: false,
			// 		data: data,
			// 		async: true,
			// 		beforeSend: function (request) {
			// 			request.setRequestHeader("x-csrf-token", "fetch");
			// 		},
			// 		success: function (data, textStatus, xhr) {
			// 			var csrfToken = xhr.getResponseHeader("x-csrf-token");
			// 			if (!csrfToken) {
			// 				Toast.show("Error from CSRF request - response ok but no CSRF header");
			// 			}
			// 			cssa.api.test.ApiModel.setProperty('/csrfToken', csrfToken);
			// 		},
			// 		error: function (xhr, textStatus, errorThrown) {
			// 			Toast.show("Error from CSRF request - " + JSON.stringify(xhr));
			// 		}
			// 	});
			// 	return;
			// },

			getContracts: function (ctlr) {
				var that = this;
				i18nResourceBundle = ctlr._bundle;
				var input = {
					'api': "API072_GET_CONTRACT_LIST",
					"input": {
						"readLabels": "X"
					}
				};
				$.ajax({
					url: "/irj/servlet/prt/portal/prtroot/cssa.com~wrecycle~rest~ecc~proxy~par.RestfulEccProxy",
					method: "POST",
					dataType: 'json',
					contentType: 'application/json',
					cache: false,
					data: JSON.stringify(input),
					success: function (data) {
						if (data.output && data.output.dbiContracts) {
							if (data.output.dbiContracts.length === 1) {
								var contract = data.output.dbiContracts[0];
								ctlr.onContractSelected(null, contract);
							}
							// Temporarily increase the number of records
							// var temp = [];
							// var tempc = data.output.dbiContracts[0];
							// for (var i = 0; i < 39; i++) {
							// 	data.output.dbiContracts.push(tempc);
							// }
							// eslint-disable-next-line no-undef
							cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/ContractData", data.output);
							// Assign column headings if needed
							// ctlr.assignColumnHeadings(data.output.dbiContracts[0]);
						}
						ctlr.onBusyDialogClose();
					},
					error: function (xhr) {
						Toast.show(i18nResourceBundle.getText("upexpectedError1"));
					}
				});

			},

			getPermissions: function (ctlr) {
				var that = this;
				var input = {
					'api': "API153_GET_USR_PERMISSIONS"
				};
				$.ajax({
					url: "/irj/servlet/prt/portal/prtroot/cssa.com~wrecycle~rest~ecc~proxy~par.RestfulEccProxy",
					method: "POST",
					dataType: 'json',
					contentType: 'application/json',
					cache: false,
					data: JSON.stringify(input),
					success: function (data) {
						// eslint-disable-next-line no-undef
						cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/Permissions", data.output);
						ctlr.checkAppMode();
					},
					error: function (xhr) {
						Toast.show(i18nResourceBundle.getText("upexpectedError2"));
					}
				});

			},

			uploadSpreadsheet: function (contract, content, fileName, contentType, ctlr) {
				var that = this;
				// var input = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/ContractData");
				// eslint-disable-next-line no-undef
				var dispCode = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/DispCodeRequired") ? "X" : "";
				var appMode = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/AppMode"); // eslint-disable-line no-undef
				var interface = appMode === ctlr._APPMODEAUDIT ? ctlr._APPMODEAUDIT : ctlr._APPMODEUPLOAD;
				var input = {
					'api': 'API091_UPLOAD_SPREADSHT',
					'input': {
						'ebeln': contract.ebeln,
						'ekgrp': contract.ekgrp,
						'lifnr': contract.lifnr,
						'filename': fileName,
						'content': content,
						'mimetype': contentType,
						"flg_disp_code": dispCode,
						"interface": interface
					}
				};
				$.ajax({
					url: "/irj/servlet/prt/portal/prtroot/cssa.com~wrecycle~rest~ecc~proxy~par.RestfulEccProxy",
					method: "POST",
					dataType: 'json',
					contentType: 'application/json',
					cache: false,
					data: JSON.stringify(input),
					success: function (data) {
						if (data.output && data.output.upload) {
							// Set the column headings if required
							ctlr.assignColumnHeadings(contract);
							// Resolve messages
							Utils.resolveMessages(data.output.upload);
							// eslint-disable-next-line no-undef
							cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/ValidatedData", data.output.upload);
							// eslint-disable-next-line no-undef
							if (data.output.flgDispCode && data.output.flgDispCode === "X") {
								// eslint-disable-next-line no-undef
								cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/DispCodeRequired", true);
								// Add the column
								ctlr.addDispositionCodeColumn();
							} else {
								// eslint-disable-next-line no-undef
								cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/DispCodeRequired", false);
							}
							ctlr.batchUpContent();
							Utils.summariseTotals(data.output.upload);
						}
					},
					error: function (xhr) {
						///console.log(xhr);
						Toast.show(i18nResourceBundle.getText("upexpectedError3"));
					}
				});

			},

			manageSubmission: function (ctlr) {
				// Get data for a full submission
				cssa.sp.cssaupldsprdsheet.ctlr = ctlr; // eslint-disable-line no-undef
				var validatedData = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/ValidatedData"); // eslint-disable-line no-undef
				// Clear batch responses 
				cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/BatchResponses", []); // eslint-disable-line no-undef
				// Do we need to batch the submission
				var batchingRequired = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/BatchingRequired"); // eslint-disable-line no-undef
				var currentBatch = {};
				currentBatch.index = 0;
				if (batchingRequired) {
					var batches = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/Batches"); // eslint-disable-line no-undef
					currentBatch.batch = batches.batch[currentBatch.index];
					currentBatch.maxBatches = batches.batch.length;
				} else {
					currentBatch.batch = validatedData;
					currentBatch.maxBatches = 1;
				}
				cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/CurrentBatch", currentBatch); // eslint-disable-line no-undef				
				this.submitSpreadsheet(ctlr, this.submissionCallback);
			},

			submissionCallback: function (response, ctlr, that) {
				// Handle return from submitSpreadsheet and submit next batch entry if needed	
				var batchResponses = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/BatchResponses"); // eslint-disable-line no-undef				
				batchResponses.push(response);
				// Have we got the last one?
				var currentBatch = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/CurrentBatch"); // eslint-disable-line no-undef				
				if (currentBatch.index < (currentBatch.maxBatches - 1)) {
					// Process the next batch of records
					currentBatch.index++;
					var batches = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/Batches"); // eslint-disable-line no-undef
					currentBatch.batch = batches.batch[currentBatch.index];
					currentBatch.maxBatches = batches.batch.length;
					cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/CurrentBatch", currentBatch); // eslint-disable-line no-undef				
					that.submitSpreadsheet(ctlr, that.submissionCallback);
				} else {
					// Process results of all batches
					response = that.combineResponses();
					if (response && (response.subrc !== 0 || response.bapiret2.type === "E")) {
						if (response.bapiret2 && response.bapiret2.message) {
							Toast.show(i18nResourceBundle.getText("upexpectedError6") + response.bapiret2.message);
						} else {
							Toast.show(i18nResourceBundle.getText("upexpectedError4") + response.subrc);
						}
					} else {
						if (!response) {
							Toast.show(i18nResourceBundle.getText("upexpectedError5"));
						} else {
							// Toast.show('To remove. Successful response from submission');
						}
					}
					if (response.subrc === 0) {
						cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/Confirmation", response); // eslint-disable-line no-undef
						if (response.tDeliveries) {
							var dels = [];
							for (var d = 0; d < response.tDeliveries.length; d++) {
								dels.push({
									vbeln: response.tDeliveries[d]
								});
							}
							cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/Deliveries", dels); // eslint-disable-line no-undef							
						} else {
							cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/Deliveries", []); // eslint-disable-line no-undef
						}
						var confirmationResults = Utils.formatConfirmationResults(response);
						cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/ConfirmationResults", confirmationResults); // eslint-disable-line no-undef
						// Disable submission
						cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/SubmissionActive", false); // eslint-disable-line no-undef
						ctlr.displayConfirmationStep();
						cssa.sp.cssaupldsprdsheet.ContractsModel.refresh(); // eslint-disable-line no-undef
					}
				}
			},

			combineResponses: function () {
				// This code is only required if content is batched into smaller data sets for submission to ECC
				var batchResponses = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/BatchResponses"); // eslint-disable-line no-undef
				var combinedResponse = {};
				combinedResponse.tDeliveries = [];
				combinedResponse.defaultUnit = "";
				combinedResponse.numOfBol = 0;
				combinedResponse.numOfBolLines = 0;
				combinedResponse.totalContainer = 0;
				combinedResponse.totalWeight = 0;
				combinedResponse.bapiret2 = {};
				for (var i = 0; i < batchResponses.length; i++) {
					var resp = batchResponses[i];
					if (resp.bapiret2.type !== "") {
						combinedResponse.bapiret2 = resp.bapiret2;
					}
					combinedResponse.subrc = resp.subrc;
					combinedResponse.defaultUnit = resp.defaultUnit;
					combinedResponse.numOfBol = combinedResponse.numOfBol + (resp.numOfBol * 1);
					combinedResponse.numOfBolLines = combinedResponse.numOfBolLines + (resp.numOfBolLines * 1);
					combinedResponse.totalContainer = combinedResponse.totalContainer + (resp.totalContainer * 1);
					combinedResponse.totalWeight = combinedResponse.totalWeight + (resp.totalWeight * 1);
					if (resp.tDeliveries) {
						combinedResponse.tDeliveries = combinedResponse.tDeliveries.concat(resp.tDeliveries);
					} else {
						combinedResponse.tDeliveries.push(combinedResponse.deliveryNum);
					}
				}
				return combinedResponse;
			},

			submitSpreadsheet: function (ctlr, cb) {
				var that = this;
				this.ctlr = ctlr;
				var oModel = cssa.sp.cssaupldsprdsheet.ContractsModel; // eslint-disable-line no-undef
				var currentBatch = oModel.getProperty("/CurrentBatch");
				var appMode = oModel.getProperty("/AppMode");
				var interface = appMode === ctlr._APPMODEAUDIT ? ctlr._APPMODEAUDIT : ctlr._APPMODEUPLOAD;
				var contract = oModel.getProperty("/CurrentContract");
				var input = {
					'api': 'API092_SUBMIT_FROM_UPLOAD',
					'input': {
						"report_on_behalf": "",
						"interface": interface,
						"apimode": "A", // A - Async, S = Sync, P - Poll
						"apiuuid": "",
						"contract": contract.ebeln,
						"upload_list": []
					}
				};
				var pollDelay = 300; // Wait 3/10ths of a second
				input.input.upload_list = currentBatch.batch;
				if (currentBatch.batch.length > 20) {
					// input.input.apimode = "A";
					pollDelay = 1000; // Wait 1 second before polling
				}
				oModel.setProperty("/TotalLines", input.input.upload_list.length); // eslint-disable-line no-undef
				this.totalLines = input.input.upload_list.length;
				// Post via portal proxy
				var url = "/irj/servlet/prt/portal/prtroot/cssa.com~wrecycle~rest~ecc~proxy~par.RestfulEccProxy";
				$.ajax({
					url: url,
					method: "POST",
					dataType: 'json',
					contentType: 'application/json',
					// timeout: 30000,
					// async: false,
					async: true,
					cache: false,
					data: JSON.stringify(input),
					success: function (data) {
						var response = data.output || null;
						if (response && response.apiuuid) {
							oModel.setProperty("/ApiUuid", response.apiuuid); // eslint-disable-line no-undef
						}
						if (response.bapiret2 && response.bapiret2.type && response.bapiret2.type === "E") {
							// Error
							cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/StopPolling', true); // eslint-disable-line no-undef
							Toast.show(response.bapiret2.message);
							return;
						}
						var originalCount = response.ordercount;
						oModel.setProperty("/OrderCount", response.ordercount); // eslint-disable-line no-undef
						// var currentCount = originalCount + 5; // Assume we've done 5 for a value
						// var totalLines = that.totalLines;
						// var percentComplete = Math.round((currentCount - originalCount) / totalLines * 100, 2);
						oModel.setProperty('/PercentComplete', 0);
						ctlr.displayProgressIndicator(0);
					},
					error: function (xhr) {
						///console.log(xhr);
						// if (xhr.status === 504 || xhr.status === 0) {
						// 	// Time out or status is zero - for now just ignore
						// } else {
						Toast.show(i18nResourceBundle.getText("upexpectedError7") + xhr.status);
						// }
					}
				});
				// Poll for the result from the call
				// Reset the stop polling flag - in case it is set
				cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/StopPolling', false); // eslint-disable-line no-undef
				this.done = false;
				var totalCount = input.input.upload_list.length;
				// Determine pollDelay - calculate time to process - estimate 300 seconds per 50.
				var totalTime = Math.floor((totalCount / 50) * 300000);
				var pollDelay = 2000;
				if (totalCount > 50) {
					pollDelay = 2000;
				}
				console.log('Total time: ' + totalTime + ' Poll Delay: ' + pollDelay + ' Total Count: ' + totalCount);
				this.maxCallCount = Math.floor(totalTime / pollDelay) + 5; // Maximum allowable calls
				// cssa.sp.cssaupldsprdsheet.callCount = callCount; // eslint-disable-line no-undef
				this.callCount = 0;
				this.pollDelay = pollDelay;
				var poll = setTimeout(this.pollForSubmissionResponse.bind(this), pollDelay); // Poll every three seconds up to 5 minutes
			},

			saveSpreadsheet: function (ctlr) {
				var that = this;
				this.ctlr = ctlr;
				var oModel = cssa.sp.cssaupldsprdsheet.ContractsModel; // eslint-disable-line no-undef
				var uploadList = oModel.getProperty("/ValidatedData");
				var appMode = oModel.getProperty("/AppMode");
				var interface = appMode === ctlr._APPMODEAUDIT ? ctlr._APPMODEAUDIT : ctlr._APPMODEUPLOAD;
				var contract = oModel.getProperty("/CurrentContract");
				var input = {
					'api': 'API092_SUBMIT_FROM_UPLOAD',
					'input': {
						"report_on_behalf": "",
						"interface": interface,
						"apimode": "V", // A - Async, S = Sync, P - Poll, V = Save
						"apiuuid": "",
						"contract": contract.ebeln,
						"upload_list": []
					}
				};
				input.input.upload_list = uploadList;
				// Post via portal proxy
				var url = "/irj/servlet/prt/portal/prtroot/cssa.com~wrecycle~rest~ecc~proxy~par.RestfulEccProxy";
				$.ajax({
					url: url,
					method: "POST",
					dataType: 'json',
					contentType: 'application/json',
					// timeout: 30000,
					// async: false,
					async: true,
					cache: false,
					data: JSON.stringify(input),
					success: function (data) {
						var response = data.output || null;
						if (response.bapiret2 && response.bapiret2.type && response.bapiret2.type === "E") {
							// Got error when saving draft report
							ctlr.onMessageDialog(Utils.getResourceText('saveError') + " " + response.bapiret2.message, 'Error');
						} else {
							ctlr.onMessageDialog(Utils.getResourceText('saveSuccess'), 'Success');
						}
					},
					error: function (xhr) {
						Toast.show(i18nResourceBundle.getText("upexpectedError7") + xhr.status);
					}
				});
			},

			pollForSubmissionResponse: function () {
				var that = this;
				var stopPolling = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty('/StopPolling'); // eslint-disable-line no-undef
				if (stopPolling) {
					return;
				}
				var ctlr = cssa.sp.cssaupldsprdsheet.ctlr; // eslint-disable-line no-undef
				var _cssa = cssa.sp.cssaupldsprdsheet; // eslint-disable-line no-undef
				var appMode = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/AppMode"); // eslint-disable-line no-undef
				var interface = appMode === _cssa._APPMODEAUDIT ? _cssa._APPMODEAUDIT : _cssa._APPMODEUPLOAD;
				var oModel = cssa.sp.cssaupldsprdsheet.ContractsModel; // eslint-disable-line no-undef
				var apiuuid = oModel.getProperty("/ApiUuid");
				that.callCount++;
				if (!apiuuid || apiuuid === "") {
					if (that.callCount < that.maxCallCount) {
						var poll = setTimeout(this.pollForSubmissionResponse, 3000); // Poll every three seconds up to 5 minutes
					}
					console.log('Got no API UUID');
					return; // Try again next time
				}
				var contract = oModel.getProperty("/CurrentContract");
				var input = {
					'api': 'API092_SUBMIT_FROM_UPLOAD',
					'input': {
						"report_on_behalf": "",
						"interface": interface,
						"apimode": "P",
						"apiuuid": apiuuid,
						"contract": contract.ebeln,
						"upload_list": []
					}
				};
				// Post via portal proxy
				var url = "/irj/servlet/prt/portal/prtroot/cssa.com~wrecycle~rest~ecc~proxy~par.RestfulEccProxy";
				$.ajax({
					url: url,
					method: "POST",
					dataType: 'json',
					contentType: 'application/json',
					// timeout: 30000,
					// async: false,
					async: true,
					cache: false,
					data: JSON.stringify(input),
					success: function (data) {
						var response = data.output || null;
						if (response.bapiret2 && response.bapiret2.type && response.bapiret2.type === "E") {
							// Error
							cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/StopPolling', true); // eslint-disable-line no-undef
							// JIRA 1196 - providing explicit duration and offset
							Toast.show(i18nResourceBundle.getText("processError"), {
								duration: 5000,
								offset: "0 0"
							});
							// Toast.show(response.bapiret2.message);
							if (ctlr) {
								ctlr.closeProgressDialog();
							}
							return;
						}
						var noDialog = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/ProgressInactive"); // eslint-disable-line no-undef
						var file = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty('/LastFile'); // eslint-disable-line no-undef
						if (noDialog) {
							// Progress dialog is dead and therefore no UI components are live for Upload Spreadsheet
							if (response.subrc === 0 && (response.completed === "X" || response.completed === true)) {
								Toast.show(i18nResourceBundle.getText("SubmittedFileCompleted1") + " " + file.name + " " + i18nResourceBundle.getText(
									"SubmittedFileCompleted2"), {
									width: "50rem",
									duration: 10000,
									at: "center center",
								});
							} else {
								if (that.callCount < that.maxCallCount) {
									var poll = setTimeout(that.pollForSubmissionResponse.bind(that), that.pollDelay); // Poll every three seconds up to 5 minutes
								}
							}
							return;
						}
						if (response.currentcount) {
							oModel.setProperty("/CurrentOrderCount", response.currentCount);
							// var originalCount = oModel.getProperty("/OrderCount");
							// var currentCount = response.ordercount || 0;
							// var totalLines = that.totalLines;
							var targetCount = response.targetcount;
							var currentCount = response.currentcount;
							var percentComplete = Math.round(currentCount / targetCount * 100, 0);
							oModel.setProperty('/PercentComplete', percentComplete);
							ctlr.displayProgressIndicator(percentComplete);
						}
						if (response) {
							console.log('In poll response');
							if (response.subrc === 0 && (response.completed === "X" || response.completed === true)) {
								oModel.setProperty("/Confirmation", response); // eslint-disable-line no-undef
								if (response.tDeliveries) {
									var dels = [];
									for (var d = 0; d < response.tDeliveries.length; d++) {
										dels.push({
											vbeln: response.tDeliveries[d]
										});
									}
									oModel.setProperty("/Deliveries", dels); // eslint-disable-line no-undef
								} else {
									oModel.setProperty("/Deliveries", []); // eslint-disable-line no-undef
								}
								var confirmationResults = Utils.formatConfirmationResults(response);
								oModel.setProperty("/ConfirmationResults", confirmationResults); // eslint-disable-line no-undef
								// Disable submission
								oModel.setProperty("/SubmissionActive", false); // eslint-disable-line no-undef
								ctlr.displayConfirmationStep();
								oModel.refresh(); // eslint-disable-line no-undef
								// Kill the progress dialog
								ctlr.closeProgressDialog();
							} else {
								if (that.callCount < that.maxCallCount) {
									var poll = setTimeout(that.pollForSubmissionResponse.bind(that), that.pollDelay); // Poll every three seconds up to 5 minutes
								}
							}
						} else {
							if (that.callCount < that.maxCallCount) {
								var poll = setTimeout(that.pollForSubmissionResponse.bind(that), that.pollDelay); // Poll every three seconds up to 5 minutes
							}
						}
					},
					error: function (xhr) {
						Toast.show(i18nResourceBundle.getText("upexpectedError8") + xhr.status);
					}
				});
			},

			getDownloadAddress: function () {
				var that = this;
				var input = {
					'api': "API152_GET_ECC_URL"
				};
				$.ajax({
					url: "/irj/servlet/prt/portal/prtroot/cssa.com~wrecycle~rest~ecc~proxy~par.RestfulEccProxy",
					method: "POST",
					dataType: 'json',
					contentType: 'application/json',
					cache: false,
					data: JSON.stringify(input),
					success: function (data) {
						cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/ECCUrlData", data.output); // eslint-disable-line no-undef
					},
					error: function (xhr) {
						Toast.show(i18nResourceBundle.getText("upexpectedError9"));
					}
				});
			},

			downloadUrl: function (url) {
				var xhReq = new XMLHttpRequest();
				// var parameters = "";
				// for (i = 0; i < formObj.elements.length; i++) {
				// 	parameters += formObj.elements[i].name + "=" + encodeURI(formObj.elements[i].value) + "&";
				// }
				xhReq.open("GET", url, false);
				// xhReq.setRequestHeader("Connection", "close");
				xhReq.setRequestHeader("Content-Disposition", "attachment"); // For download
				// xhReq.send(parameters);
				xhReq.send();
				// document.write(xhReq.responseText);
			},

			getSpreadsheetTemplate: function (vendor, contract) {
				// Download template URL = 
				var downloadAddress = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/ECCUrlData"); // eslint-disable-line no-undef
				if (!downloadAddress) {
					Toast.show(i18nResourceBundle.getText("upexpectedError10"));
				} else {
					var url = downloadAddress.downloadurl;
					url = url + "/sshttempl/" + vendor + "/" + contract + "/?" + downloadAddress.clientstring;
					sap.m.URLHelper.redirect(url, false);
					// this.downloadUrl(url);
				}
			},

			setAuth: function () {
				// var cookies = document.cookie.split(';');
				// for (var i = 0; i < cookies.length; i++) {
				// 	var keyValue = cookies[i].split('=');
				// 	if (keyValue[0] === "MYSAPSSO2") {
				// 		cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/MYSAPSSO2", keyValue[1]); // eslint-disable-line no-undef
				// 		// Set the cookie into the domain for SAP ECC
				// 		var eccDetails = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/ECCUrlDetails"); // eslint-disable-line no-undef
				// 		// document.cookie =
				// 	}
				// }
				var eccUrlDetails = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/ECCUrlDetails"); // eslint-disable-line no-undef
				var mySAPSSO2 = eccUrlDetails.ticket;
				var domain = eccUrlDetails.domain;
				document.cookie = document.cookie + 'MYSAPSSO2=' + mySAPSSO2 + ';domain=' + domain;
			},

			getEccUrl: function () {
				var that = this,
					input = {
						'api': "API152_GET_ECC_URL"
					};
				$.ajax({
					url: "/irj/servlet/prt/portal/prtroot/cssa.com~wrecycle~rest~ecc~proxy~par.RestfulEccProxy",
					method: "POST",
					dataType: 'json',
					contentType: 'application/json',
					cache: false,
					data: JSON.stringify(input),
					error: function (xhr) {
						///console.log(xhr);
						sap.m.MessageToast.show(i18nResourceBundle.getText("upexpectedError11"));
					},
					success: function (data) {
						cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/ECCUrlDetails", data.output); // eslint-disable-line no-undef
						that.setAuth();
					}
				});
			},

			downloadClaimPDF: function (doc) {
				var confResults = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/ConfirmationResults"); // eslint-disable-line no-undef
				var claimDoc = confResults[0].value;
				if (doc && doc !== "") {
					claimDoc = doc;
				}
				var that = this,
					input = {
						'api': "API152_GET_ECC_URL"
							//'input': {"zvbeln": "1800294468"}
					};
				$.ajax({
					url: "/irj/servlet/prt/portal/prtroot/cssa.com~wrecycle~rest~ecc~proxy~par.RestfulEccProxy",
					method: "POST",
					dataType: 'json',
					contentType: 'application/json',
					cache: false,
					data: JSON.stringify(input),
					error: function (xhr) {
						///console.log(xhr);
						sap.m.MessageToast.show(i18nResourceBundle.getText("upexpectedError1"));
					},
					success: function (data) {
						if (claimDoc !== "") {
							var url = data.output.downloadurl + "/claimpdf/" + claimDoc + "/?" + data.output.clientstring;
							sap.m.URLHelper.redirect(url, true);
						}
					}
				});
			},

			downloadClaimCSV: function (doc) {
				var confResults = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/ConfirmationResults"); // eslint-disable-line no-undef
				var claimDoc = confResults[0].value;
				if (doc && doc !== "") {
					claimDoc = doc;
				}
				var eccDetails = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/ECCUrlData"); // eslint-disable-line no-undef
				var downloadUrl = eccDetails.downloadurl;
				var clientstring = eccDetails.clientstring;
				if (claimDoc !== "") {
					var url = downloadUrl + "/claimcsv/" + claimDoc + "/?" + clientstring;
					sap.m.URLHelper.redirect(url, true);
				}
			}

		};

	});