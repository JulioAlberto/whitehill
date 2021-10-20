sap.ui.define([
		'sap/ui/base/ManagedObject',
		'sap/m/MessageToast',
		'sap/m/MessageView',
		'sap/m/Dialog',
		'sap/m/MessagePopoverItem'
	],
	function (MObj, Toast, MessageView, Dialog, MessagePopoverItem) {

		return {

			getResourceText: function (sKey) {
				// Load the resource bundle if it doesn't already exist 
				var oBundle;
				if (!cssa.sp.cssaupldsprdsheet || !cssa.sp.cssaupldsprdsheet.bundle) { // eslint-disable-line no-undef
					Toast.show("Missing language texts. Please contact support");
				} else {
					oBundle = cssa.sp.cssaupldsprdsheet.bundle; // eslint-disable-line no-undef
				}
				return oBundle.getText(sKey);
			},

			resolveMessages: function (data) {
				var issueCount = 0;
				var issueLines = 0;
				var displayMessages = [];
				for (var i = 0; i < data.length; i++) {
					var rec = data[i];
					if (rec.messages && rec.messages.length > 0) {
						data[i].icon = 'sap-icon://decline';
						data[i].iconColour = '#FF0000';
						rec.messages.issueCount = rec.messages.length;
						issueCount += rec.messages.issueCount;
						if (rec.messages.issueCount > 0) {
							issueLines++;
						}
						if (rec.messages.issueCount > 1) {
							rec.message = rec.messages.issueCount + ' issues'; //TODO sort out language support
						} else {
							rec.message = rec.messages[0].msgtext;
						}
						for (var j = 0; j < rec.messages.length; j++) {
							var displayMessage = {};
							var msg = rec.messages[j];
							if (msg.msgtp === 'E') {
								displayMessage.type = 'Error';
							} else if (msg.msgtp === 'W') {
								displayMessage.type = 'Warning';
							} else if (msg.msgtp === 'S') {
								displayMessage.type = 'Information';
							} else if (msg.msgtp === 'I') {
								displayMessage.type = 'Information';
							} else {
								displayMessage.type = 'None';
							}
							displayMessage.title = msg.msgtext;
							displayMessage.description = msg.msgtext;
							displayMessage.group = 'Document: ' + rec.bolno + " Row: " + rec.seqno; //TODO Language
							displayMessage.seqno = rec.seqno; // To allow identification of the messages
							displayMessages.push(displayMessage);
						}
					} else {
						data[i].icon = 'sap-icon://accept';
						data[i].iconColour = '#008000';
					}
				}
				// for (var i = 0; i < data.length; i++) {
				// 	if (data[i].state === '1') {
				// 		data[i].icon = 'sap-icon://accept';
				// 		data[i].iconColour = '#008000';
				// 	} else {
				// 		data[i].icon = 'sap-icon://decline';
				// 		data[i].iconColour = '#FF0000';
				// 	}
				// }				

				cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/CurrentRowCount", data.length); // eslint-disable-line no-undef
				cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/CurrentIssueCount", issueCount); // eslint-disable-line no-undef
				cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/CurrentIssueLines", issueLines); // eslint-disable-line no-undef
				var readyForSubmit = false;
				if (issueCount === 0) {
					readyForSubmit = true;
				}
				cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/ReadyForSubmit", readyForSubmit); // eslint-disable-line no-undef
				cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/DisplayMessages", displayMessages); // eslint-disable-line no-undef
				cssa.sp.cssaupldsprdsheet.ContractsModel.refresh();
			},

			displayMessages: function (seqno, that, e, pos) {

				if (!pos) {
					pos = "BOTTOM";
				}
				var oMessageTemplate = new MessagePopoverItem({
					type: '{type}',
					title: '{title}',
					description: '{description}',
					counter: '{counter}',
					groupName: '{group}'
						// link: oLink
				});
				var temp = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/DisplayMessages"); // eslint-disable-line no-undef
				var messages = [];
				var titleText = "";
				var issueCount = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/CurrentIssueCount"); // eslint-disable-line no-undef
				if (seqno !== -1) {
					messages = temp.filter(function (el) {
						return el.seqno === seqno;
					});
					titleText = "Issues on Row " + seqno //TODO Sort language text
				} else {
					messages = temp;
					titleText = issueCount + " Issues";
				}
				var oModel = new sap.ui.model.json.JSONModel();
				oModel.setData(messages);

				that.oMessageView = new MessageView({
					showDetailsPageHeader: false,
					itemSelect: function () {
						oBackButton.setVisible(true);
					},
					items: {
						path: '/',
						template: oMessageTemplate
					},
					groupItems: true
				});
				var oBackButton = new sap.m.Button({
					icon: sap.ui.core.IconPool.getIconURI("nav-back"),
					visible: false,
					press: function () {
						that.oMessageView.navigateBack();
						this.setVisible(false);
					}
				});

				that.oMessageView.setModel(oModel);

				var oCloseButton = new sap.m.Button({
						text: "Close",
						press: function () {
							that._oPopover.close();
						}
					}),
					oPopoverFooter = new sap.m.Bar({
						contentRight: oCloseButton
					}),
					oPopoverBar = new sap.m.Bar({
						contentLeft: [oBackButton],
						contentMiddle: [
							new sap.ui.core.Icon({
								color: "#bb0000",
								src: "sap-icon://message-error"
							}),
							new sap.m.Text({
								text: titleText
							})
						]
					});

				that._oPopover = new sap.m.Popover({
					customHeader: oPopoverBar,
					contentWidth: "440px",
					contentHeight: "440px",
					verticalScrolling: false,
					modal: true,
					content: [that.oMessageView],
					footer: oPopoverFooter
				});

				if (seqno === -1) {
					that._oPopover.setPlacement(sap.m.VerticalPlacementType.Vertical);
				}

				that._oPopover.openBy(e.getSource());

				// that.oDialog = new Dialog({
				// 	content: that.oMessageView,
				// 	contentHeight: "440px",
				// 	contentWidth: "640px",
				// 	endButton: new sap.m.Button({
				// 		text: "Close",
				// 		press: function () {
				// 			this.getParent().close();
				// 		}
				// 	}),
				// 	customHeader: new sap.m.Bar({
				// 		contentMiddle: [
				// 			new sap.m.Text({
				// 				text: "Document Errors"
				// 			})
				// 		],
				// 		contentLeft: [oBackButton]
				// 	}),
				// 	verticalScrolling: false
				// });
				// that.oDialog.open();
			},

			formatConfirmationResults: function (response) {
				var deliveries = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/Deliveries"); // eslint-disable-line no-undef
				var resp = [];
				if (deliveries && deliveries.length > 1) {
					// Do nothing - displaying the contents of the table
				} else {
					resp.push({
						desc: this.getResourceText('deliverynum') + ': ',
						value: response.deliveryNum,
					});
				}
				// Grab i18n text for the confirmation results and format into a iterable object
				var totalContainer = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/SumOfContainers"); // eslint-disable-line no-undef
				if (!totalContainer) {
					totalContainer = 0;
				}
				resp = resp.concat([{
					desc: this.getResourceText('numOfBol') + ': ',
					value: response.numOfBol,
				}]);
				var summary = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/Summary"); // eslint-disable-line no-undef
				for (var i = 0; i < summary.length; i++) {
					resp.push({
						desc: summary[i].summaryText,
						value: summary[i].total + " " + summary[i].uom
					});
				}
				// , {
				// 	desc: this.getResourceText('totalContainer') + ': ',
				// 	// value: response.totalContainer,
				// 	value: totalContainer,
				// }, {
				// 	desc: this.getResourceText('totalWeight') + ': ',
				// 	value: (response.totalWeight || 0) + ' ' + response.defaultUnit,
				// }, {
				// 	desc: this.getResourceText('totalVolume') + ': ',
				// 	value: response.totalVolume || 0,
				// }, {
				// 	desc: this.getResourceText('totalUnits') + ': ',
				// 	value: response.totalUnits || 0,
				// }]);
				return resp;
			},

			summariseTotals: function (uploadData) {
				var summary = [];
				var totalText = this.getResourceText('total');
				var enteredText = this.getResourceText('entered');
				for (var i = 0; i < uploadData.length; i++) {
					var found = false;
					for (var j = 0; j < summary.length; j++) {
						if (uploadData[i].baseUom === summary[j].uom) {
							found = true;
							summary[j].count++;
							summary[j].total = summary[j].total + (uploadData[i].weight * 1);
						}
					}
					if (!found) {
						var entry = {};
						entry.count = 1;
						entry.total = uploadData[i].weight * 1;
						entry.uom = uploadData[i].baseUom;
						entry.uomText = uploadData[i].baseUomText;
						entry.summaryText = totalText + " " + entry.uomText + " " + enteredText;
						summary.push(entry);
					}
				}
				cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/Summary", summary); // eslint-disable-line no-undef

			}

			// getResourceText: function (sKey) {
			// 	jQuery.sap.require("jquery.sap.resources");
			// 	var sLocale = sap.ui.getCore().getConfiguration().getLanguage();
			// 	var oBundle = jQuery.sap.resources({
			// 		url: "i18n/messageBundle.properties",
			// 		locale: sLocale
			// 	});
			// 	return oBundle.getText(sKey);
			// }

			// handleMessageViewPress: function (oEvent) {
			// 	that.oMessageView.navigateBack();
			// 	that.oDialog.open();
			// }
		};

	});