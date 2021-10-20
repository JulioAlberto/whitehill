sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"cssa/sp/cssaupldsprdsheet/service/ContractData",
	"cssa/sp/cssaupldsprdsheet/service/ServiceManager",
	"cssa/sp/cssaupldsprdsheet/util/Utils",
	"sap/m/UploadCollectionParameter",
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Filter',
	"sap/m/MessageToast"
], function (Controller, contracts, SM, Utils, UploadCollectionParameters, JSONModel, Filter, Toast) {
	"use strict";

	return Controller.extend("cssa.sp.cssaupldsprdsheet.controller.UploadSpreadsheet", {

		_view: null,
		_appMode: "",
		_APPMODEAUDIT: "AUDIT",
		_APPMODEUPLOAD: "UPLOAD",

		onInit: function () {
			// First we have to check if we're in Audit mode. 
			SM.getPermissions(this);
			// Load the SAP ECC URL details for future use
			SM.getEccUrl();
			// Get authentication detail and set for future downloads
			// SM.setAuth();
			cssa.sp.cssaupldsprdsheet._APPMODEAUDIT = "AUDIT"; // eslint-disable-line no-undef
			cssa.sp.cssaupldsprdsheet._APPMODEUPLOAD = "UPLOAD"; // eslint-disable-line no-undef
			this._view = this.getView();
			// Get the bundle for future use
			cssa.sp.cssaupldsprdsheet.bundle = this.getOwnerComponent().getModel("i18n").getResourceBundle(); // eslint-disable-line no-undef
			// cssa.sp.cssaupldsprdsheet.bundle = this._view.getModel("i18n").getResourceBundle(); // eslint-disable-line no-undef
			this._bundle = cssa.sp.cssaupldsprdsheet.bundle; // eslint-disable-line no-undef
			this.openBusyDialog();
			SM.getContracts(this);
			var oModel = cssa.sp.cssaupldsprdsheet.ContractsModel; // eslint-disable-line no-undef
			oModel.setSizeLimit(9999999);
			this.getView().setModel(oModel, 'contractlist');
			this._wizard = this.byId("UploadSpreadsheetWizard");
			this.oColumnModel = new JSONModel();
			this.oColumnModel.setData(this.oColumns);
			this.getView().setModel(this.oColumnModel, "columns");
			cssa.sp.cssaupldsprdsheet.ColumnModel = this.oColumnModel; // eslint-disable-line no-undef
			this.oItemModel = new JSONModel();
			this.oItemModel.setData(this.oItems);
			this.getView().setModel(this.oItemModel, "items");
			var oTable = this.getView().byId('table0');
			this.prepareTable(oTable);
			var submissionActive = true;
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/SubmissionActive", submissionActive); // eslint-disable-line no-undef
			var readyForSubmit = false;
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/ReadyForSubmit", readyForSubmit); // eslint-disable-line no-undef
			SM.getDownloadAddress();
			// Assume we don't need disposition codes
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/DispCodeRequired", false); // eslint-disable-line no-undef
			// Set the file count on entry to suppress Continue button
			var fileCount = 0;
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/FileCount', fileCount); // eslint-disable-line no-undef
			var msgButton = this.getView().byId('MessageButton');
			msgButton.attachBrowserEvent('click', this.handleClick, this);
			// Reset column styles
			for (var i = 0; i < this.oColumns.length; i++) {
				this.oColumns[i].styleClass = "";
			}
		},

		eventHandler: function (e) {
			console.log("In event handler");
		},

		handleClick: function (e) {
			// Activated when the show all messages button is activated to determine how to position the popover.
			// Relies on the fact browser event is handled before UI5 event
			console.log('In handle click');
			this.messageButtonPos = {};
			this.messageButtonPos.x = e.screenX;
			this.messageButtonPos.y = e.screenY;
			var topOrBottom = false;
			if ((window.innerWidth - e.screenX) < 200) {
				// Not even room to show by the side
				topOrBottom = true;
			} else {
				this.messageButtonPos.position = sap.m.VerticalPlacementType.Auto;
			}
			if (topOrBottom) {
				if ((window.innerHeight - e.screenY) < 400) {
					this.messageButtonPos.position = sap.m.VerticalPlacementType.Top;
				} else {
					this.messageButtonPos.position = sap.m.VerticalPlacementType.Bottom;
				}
			}
			this.messageButtonPos.screenWidth = e.screenX;
		},

		openBusyDialog: function () {
			// instantiate dialog
			if (!this._busyDialog) {
				this._busyDialog = sap.ui.xmlfragment("cssa.sp.cssaupldsprdsheet.view.BusyDialog", this);
				this.getView().addDependent(this._busyDialog);
			}
			// open dialog
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._dialog);
			this._busyDialog.open();
			// // simulate end of operation
			// _timeout = jQuery.sap.delayedCall(3000, this, function () {
			// 	this._dialog.close();
			// });
		},

		onBusyDialogClose: function (oEvent) {
			this._busyDialog.close();
		},
		// This app runs in two modes. In Upload mode, it is used to upload claims, in Audit mode it is used to upload a special type of claim
		// We check the mode by checking the current users permssions. (Called from Service Manager after permissions are loaded)
		checkAppMode: function () {
			var permissions = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/Permissions"); // eslint-disable-line no-undef
			if (permissions && (permissions.auditDataEntry === "X" || permissions.auditSubmit === "X" || permissions.auditApprove === "X")) {
				this._appMode = this._APPMODEAUDIT;
			} else {
				this._appMode = this._APPMODEUPLOAD;
			}
			if (permissions && (permissions.auditSubmit === "X" || permissions.reportSubmit === "X")) {
				this._canSubmit = true;
			} else {
				this._canSubmit = false;
			}
			if (permissions && (permissions.auditSubmit === "X" || permissions.auditDataEntry === "X" || permissions.reportSubmit === "X")) {
				this._canSave = true;
			} else {
				this._canSave = false;
			}
			var that = this;
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/AppMode", this._appMode); // eslint-disable-line no-undef
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/CanSubmit", this._canSubmit); // eslint-disable-line no-undef
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/CanSave", this._canSave); // eslint-disable-line no-undef
			// Set the application title based on the application mode
			this.getOwnerComponent().getService("ShellUIService").then( // promise is returned
				function (oService) {
					var sTitle = that.getView().getModel("i18n").getResourceBundle().getText("appTitle" + that._appMode);
					oService.setTitle(sTitle);
				},
				function (oError) {
					jQuery.sap.log.error("Cannot get ShellUIService", oError, "cssa.sp.uploadsprdsheet");
				}
			);
			return this._appMode;
		},

		onSearch: function (oEvt) {
			// add filter for search
			var aFilters = [];

			var sQuery = oEvt.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var filter = new Filter({
					filters: [
						new Filter("descr", sap.ui.model.FilterOperator.Contains, sQuery),
						new Filter("ebeln", sap.ui.model.FilterOperator.Contains, sQuery),
					],
					and: false
				});
				aFilters.push(filter);
			}
			// update list binding
			var list = this.byId("contractTable");
			var binding = list.getBinding("items");
			binding.filter(aFilters, "Application");
		},

		onSuggestContract: function (oEvt) {
			var aFilters = [];
			var sQuery = oEvt.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var filter = new Filter({
					filters: [
						new Filter("descr", sap.ui.model.FilterOperator.Contains, sQuery),
						new Filter("ebeln", sap.ui.model.FilterOperator.Contains, sQuery),
					],
					and: false
				});
				aFilters.push(filter);
			}
			// update list binding
			var list = this.byId("contractTable");
			var binding = list.getBinding("items");
			binding.filter(aFilters, "Application");
		},

		onSubmitReport: function (e) {
			// Count the number of contaiers for the summary - this needs to be done here because API077 doesn't count 
			// containers in a way that works for the Upload Spreadsheet app
			var content = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty('/ValidatedData'); // eslint-disable-line no-undef
			var sumOfContainers = 0;
			for (var i = 0; i < content.length; i++) {
				var row = content[i];
				if (row.containerId && row.containerId !== "") {
					sumOfContainers = sumOfContainers + (row.quantity * 1);
				}
			}
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/SumOfContainers', sumOfContainers); // eslint-disable-line no-undef
			// Get the controller from the parent view
			var b = e.getSource();
			b.setEnabled(false);
			var view = null;
			while (b && b.getParent) {
				b = b.getParent();
				if (b instanceof sap.ui.core.mvc.View) {
					view = b;
				}
			}
			if (view) {
				var saveButton = view.byId('SaveButton');
				if (saveButton) {
					saveButton.setEnabled(false);
				}
				var ctlr = view.getController();
				SM.manageSubmission(ctlr);
			}
		},

		onSaveReport: function (e) {
			// Get the controller from the parent view
			var b = e.getSource();
			b.setEnabled(false);
			var view = null;
			while (b && b.getParent) {
				b = b.getParent();
				if (b instanceof sap.ui.core.mvc.View) {
					view = b;
				}
			}
			if (view) {
				var ctlr = view.getController();
				SM.saveSpreadsheet(ctlr);
			}
		},

		prepareTable: function (oTable) {
			// oTable.onAfterRendering = function () {
			// 	if (sap.m.Table.onAfterRendering) {
			// 		sap.m.Table.onAfterRendering.apply(this, arguments);
			// 	}
			// 	var hdr = this.$().find('tr')[0];
			// 	var i = 0;
			// 	$(hdr).find('th').each(function (i, o) {
			// 		if (i < 3) { // Column 4 is "A" with the current layout
			// 			$(o).addClass('noBorderCell');
			// 		} else if (i === 3) {
			// 			$(o).addClass('noBorderButRightCell');
			// 		}
			// 		//$(o).addClass('columnStyle' + (i++));
			// 	});
			// };
		},

		handleLinkPress: function (e) {
			var source = e.getSource();
			var seqno = source.data('seqno');
			Utils.displayMessages(seqno, this, e);
		},

		onContractSelected: function (e, contract) {
			if (!e && contract) {
				// Nothing at this point
			} else {
				var path = e.getSource().getBindingContextPath();
				contract = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty(path); // eslint-disable-line no-undef
			}
			// Reset columns to normal
			//this.removeDispositionCodeColumn('Q');
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/CurrentContract', contract); // eslint-disable-line no-undef
			if (this._wizard.getProgressStep() === this.byId("ChooseContract")) {
				this._wizard.nextStep();
			}
		},

		onContinue: function (e) {
			// Don't continue if there are no files in the UploadColvarion
			var ctl = this.getView().byId('UploadCollection');
			var sb = this.getView().byId('SubmitButton');
			if (sb) {
				sb.setEnabled(true);
			}
			var items = ctl.getItems();
			if (!items || items.length === 0) {
				Toast.show(this._bundle.getText('select_file'));
			} else {
				if (this._wizard.getProgressStep() === this.byId("Spreadsheet")) {
					this._wizard.nextStep();
				}
			}
		},

		handleWizardCancel: function (e) {
			// Is control currently on the ChoosContract step?
			var currentStep = this.getView().byId("UploadSpreadsheetWizard").getCurrentStep();
			if (currentStep.indexOf('ChooseContract') > 0) {
				// Go back home
				this.onReturnHome(e);
			} else {
				this.clearSpreadsheet();
			}
		},

		onGoBack: function (e) {
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/ValidatedData', []); // eslint-disable-line no-undef
			if (this._wizard.getProgressStep() === this.byId("SubmitReport")) {
				this._wizard.previousStep();
			}
		},

		displayConfirmationStep: function () {
			// Should only ever come from the SubmitReport step
			// Disable the submission buttons
			this.disableSubmission();
			// If we get here the file must have been processed so clear the file and spreadsheet content
			this.getView().byId("UploadCollection").removeAllItems();
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/FileCount', 0); // eslint-disable-line no-undef
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/LastFile', null); // eslint-disable-line no-undef
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/LastContent', []); // eslint-disable-line no-undef			
			if (this._wizard.getProgressStep() === this.byId("SubmitReport")) {
				this._wizard.nextStep();
			}
		},

		clearSpreadsheet: function () {
			// Prep the app for another run from ChooseContract	
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/CurrentContract', {}); // eslint-disable-line no-undef
			this.getView().byId("UploadSpreadsheetWizard").setCurrentStep(this.getView().byId("ChooseContract"));
			this.getView().byId("ChooseContract").setValidated(false);
			this.getView().byId("UploadCollection").removeAllItems();
			this.getView().byId("SubmitButton").setEnabled(true);
			this.getView().byId("SaveButton").setEnabled(true);
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/SumOfContainers', 0); // eslint-disable-line no-undef
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/FileCount', 0); // eslint-disable-line no-undef
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/LastFile', null); // eslint-disable-line no-undef
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/LastContent', []); // eslint-disable-line no-undef	
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/ValidatedData', []); // eslint-disable-line no-undef
			cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty('/StopPolling', false); // eslint-disable-line no-undef
			// Kill the progress dialog if it exists
			if (this.progressDialog) {
				this.progressDialog.close(); // Just in case
				this.progressDialog = undefined;
			}
			// Reset the progress percentage if necessary
			if (this.pi) {
				this.pi.setPercentValue(0);
			}
		},

		onReportAnother: function (e) {
			// Clear existing contract data
			this.clearSpreadsheet();
		},

		onReturnHome: function (e) {
			var homeButton = sap.ui.getCore().byId("homeBtn");
			if (!homeButton) {
				sap.m.MessageToast.show(this._bundle.getText("homePageNotAvail"));
			} else {
				window.history.go(-1);
			}
		},

		disableSubmission: function () {
			this.getView().byId('SubmitReport1').setVisible(false);
			this.getView().byId('SubmitReport2').setVisible(false);
		},

		onDownloadTemplate: function (e) {
			var contract = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty('/CurrentContract'); // eslint-disable-line no-undef
			if (!contract) {
				Toast.show(this._bundle.getText("loadSheetError1"));
			} else {
				SM.getSpreadsheetTemplate(contract.lifnr, contract.ebeln);
			}
		},

		onDownloadPDFClaim: function (e) {
			var deliveries = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty('/Deliveries'); // eslint-disable-line no-undef
			var doc = '';
			if (deliveries && deliveries.length > 1) {
				var ctl = e.getSource();
				doc = ctl.data('data');
			}
			SM.downloadClaimPDF(doc);
		},

		onDownloadXLSClaim: function (e) {
			var deliveries = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty('/Deliveries'); // eslint-disable-line no-undef
			var doc = '';
			if (deliveries && deliveries.length > 1) {
				var ctl = e.getSource();
				doc = ctl.data('data');
			}
			SM.downloadClaimCSV(doc);
		},

		onResend: function (e) {
			var contract = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty('/CurrentContract'); // eslint-disable-line no-undef
			var file = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty('/LastFile'); // eslint-disable-line no-undef
			var content = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty('/LastContent'); // eslint-disable-line no-undef
			SM.updateSpreadsheet(contract, content, file.name, file.type);
			sap.m.MessageToast.show(this._bundle.getText("resendFile") + file.name);
		},

		onChange: function (oEvent) {
			var that = this;
			var reader = new FileReader();
			var files = oEvent.getParameter("files");
			var fileCount = 0;
			if (files) {
				fileCount = files.length;
			}
			var ctl = this.getView().byId('UploadCollection');
			ctl.removeAllItems(); // Clear UploadCollection ready for new file
			var file = files[0];
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/FileCount', fileCount); // eslint-disable-line no-undef
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/LastFile', file); // eslint-disable-line no-undef
			var contract = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty('/CurrentContract'); // eslint-disable-line no-undef
			reader.onload = function (e) {
				var content = e.target.result;
				// that.handleFile(content);
				var item = ctl.getItems()[0];
				item.attachDeletePress(that.handleDeleteItem);
				item.data('ctlr', that);
				ctl.setSelectedItem(ctl.getItems()[0]);
				cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/ValidatedData', []); // eslint-disable-line no-undef
				cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/LastContent', content); // eslint-disable-line no-undef
				if (content.length <= 2) {
					sap.m.MessageToast.show(Utils.getResourceText("empty_file"));
					cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/FileCount', 0); // eslint-disable-line no-undef
					return;
				}
				if (content.length <= 20) {
					sap.m.MessageToast.show(Utils.getResourceText("almost_empty_file"));
					cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/FileCount', 0); // eslint-disable-line no-undef
					return;
				}
				SM.uploadSpreadsheet(contract, content, file.name, file.type, that);
			};

			reader.onerror = function (e) {
				sap.m.MessageToast.show(this._bundle.getText("readFileErro"));
			};
			// reader.readAsArrayBuffer(file);
			reader.readAsText(file);
		},

		handleDeleteItem: function (e) {
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/ValidatedData', []); // eslint-disable-line no-undef
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/CurrentIssueCount', 0); // eslint-disable-line no-undef
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/CurrentIssueLines', 0); // eslint-disable-line no-undef
			var uc = e.getSource().getParent();
			uc.destroyItems();
		},

		batchUpContent: function () {
			// var rows = content.split('\n');
			var rows = cssa.sp.cssaupldsprdsheet.ContractsModel.getProperty("/ValidatedData"); // eslint-disable-line no-undef
			// if (rows.length <= 50) { 
			// Note. This code is left "just in case". It was needed when the proposed solution for
			// large files was batching up content into multiple smaller files 
			// For now we just return setting BatchingRequired to false
			if (rows.length > -1) { // Force this to true for now
				cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/BatchingRequired', false); // eslint-disable-line no-undef
			} else {
				cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/BatchingRequired', true); // eslint-disable-line no-undef
				var maxRowsPerSubmission = 50;
				var mRow = 0;
				var first = true;
				var batches = {};
				batches.batch = [];
				var batch = [];
				for (var i = 0; i < rows.length; i++) {
					if (mRow === 0 && !first) {
						batches.batch.push(batch);
						batch = [];
					}
					batch.push(rows[i]);
					mRow++;
					if (mRow > maxRowsPerSubmission) {
						mRow = 0;
					}
					first = false;
				}
				if (batch.length > 0) {
					batches.batch.push(batch);
				}
				cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/Batches', batches); // eslint-disable-line no-undef
			}
		},

		// onChange: function(oEvent) {
		// 	var oUploadCollection = oEvent.getSource();
		// 	// Header Token
		// 	var oCustomerHeaderToken = new UploadCollectionParameter({
		// 		name: "x-csrf-token",
		// 		value: "securityTokenFromModel"
		// 	});
		// 	oUploadCollection.addHeaderParameter(oCustomerHeaderToken);
		// 	MessageToast.show("Event change triggered");
		// },

		onFileDeleted: function (oEvent) {
			var files = oEvent.getParameter("files");
			var fileCount = 0;
			if (files) {
				fileCount = files.length;
			}
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/ValidatedData', []); // eslint-disable-line no-undef
			cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty('/FileCount', fileCount); // eslint-disable-line no-undef
		},

		onFilenameLengthExceed: function (oEvent) {
			sap.m.MessageToast.show(this._bundle.getText("fileNameLenExcd"));
		},

		onFileSizeExceed: function (oEvent) {
			sap.m.MessageToast.show(this._bundle.getText("fileSizeExcd"));
		},

		onTypeMissmatch: function (oEvent) {
			sap.m.MessageToast.show(this._bundle.getText("typeMissMatch"));
		},

		onStartUpload: function (oEvent) {
			var oUploadCollection = this.byId("UploadCollection");
			var cFiles = oUploadCollection.getItems().length;
			var uploadInfo = cFiles + " file(s)";

			if (cFiles > 0) {
				// oUploadCollection.upload();
				sap.m.MessageToast.show(this._bundle.getText("Method Upload is called (") + " (" + uploadInfo + ")");
				sap.m.MessageBox.information("Uploaded " + uploadInfo);
			}
		},

		// onBeforeUploadStarts: function (oEvent) {
		// 	// Header Slug
		// 	var oCustomerHeaderSlug = new UploadCollectionParameter({
		// 		name: "slug",
		// 		value: oEvent.getParameter("fileName")
		// 	});
		// 	oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
		// 	setTimeout(function () {
		// 		MessageToast.show("Event beforeUploadStarts triggered");
		// 	}, 4000);
		// },

		onUploadComplete: function (oEvent) {
			var sUploadedFileName = oEvent.getParameter("files")[0].fileName;
			setTimeout(function () {
				var oUploadCollection = this.byId("UploadCollection");

				for (var i = 0; i < oUploadCollection.getItems().length; i++) {
					if (oUploadCollection.getItems()[i].getFileName() === sUploadedFileName) {
						oUploadCollection.removeItem(oUploadCollection.getItems()[i]);
						break;
					}
				}

				// delay the success message in order to see other messages before
				// sap.m.MessageToast.show("Event uploadComplete triggered");
			}.bind(this), 8000);
		},

		onSelectChange: function (oEvent) {
			var oUploadCollection = this.byId("UploadCollection");
			oUploadCollection.setShowSeparators(oEvent.getParameters().selectedItem.getProperty("key"));
		},

		onAllMessages: function (oEvent) {
			// Check if we already have the click details for this button. 
			console.log('In onAllMessages');
			var pos = "BOTTOM";
			if (this.messageButtonPos) {
				pos = this.messageButtonPos.position;
			}
			Utils.displayMessages(-1, this, oEvent, pos);
		},

		displayProgressIndicator: function (percentComplete) {
			this.percentComplete = percentComplete;
			var that = this;
			if (!this.pi) {
				this.pi = new sap.m.ProgressIndicator({
					width: "60rem",
					state: sap.ui.core.ValueState.Success,
					showValue: true
				});
				this.pi.addStyleClass('sapUiResponsiveMargin');
				// this.pi.setClass('sapUiSmallMargin');
			}
			if (!this.progressDialog) {
				var vbox = new sap.m.VBox({
					alignContent: sap.m.FlexAlignContent.Center,
					alignItems: sap.m.FlexAlignItems.Center
				});
				var progressInfo = new sap.m.Label({
					text: Utils.getResourceText('ProgressInfo'),
					wrapping: true
				});
				this.progressStatus = new sap.m.Label({
					text: Utils.getResourceText("YourFile") + " 0% " + Utils.getResourceText("Complete"),
					wrapping: true
				});
				this.progressStatus.addStyleClass('sapUiResponsiveMargin');
				progressInfo.addStyleClass('sapUiResponsiveMargin');
				vbox.addItem(this.progressStatus);
				vbox.addItem(this.pi);
				vbox.addItem(progressInfo);
				this.progressDialog = new sap.m.Dialog({
					title: '{i18n>ProcessingSubmission}',
					content: [
						vbox
					],
					// beginButton: new sap.m.Button({
					// 	type: sap.m.ButtonType.Emphasized,
					// 	text: Utils.getResourceText('ProgressOk'),
					// 	press: function () {
					// 		this.progressDialog.close();
					// 	}.bind(this)
					// }),
					endButton: new sap.m.Button({
						text: Utils.getResourceText('ProgressClose'),
						press: function () {
							cssa.sp.cssaupldsprdsheet.ContractsModel.setProperty("/ProgressInactive", true); // eslint-disable-line no-undef
							this.progressDialog.close();
							that.onReturnHome();
						}.bind(this)
					})
				});
				this.getView().addDependent(this.progressDialog);
				this.progressDialog.open();
			}
			this.getView().addDependent(this.progressDialog);
			this.pi.showValue = true;
			this.pi.displayValue = percentComplete + '%';
			this.progressStatus.setText(Utils.getResourceText("YourFile") + " " + percentComplete + "% " + Utils.getResourceText("Complete"));
			this.pi.setPercentValue(percentComplete);
			// this.pi = this.getView().byId('ProgressIndicator');
		},

		closeProgressDialog: function () {
			if (this.progressDialog) {
				this.progressDialog.close();
				this.progressDialog = undefined;
			}
		},

		onMessageDialog: function (msgText, state) {
			var that = this;
			if (!msgText) {
				msgText = "";
			}
			var dialog = new sap.m.Dialog({
				title: Utils.getResourceText(state),
				type: 'Message',
				state: state,
				content: new sap.m.Text({
					text: msgText
				}),
				beginButton: new sap.m.Button({
					type: sap.m.ButtonType.Emphasized,
					text: Utils.getResourceText('ok'),
					press: function () {
						dialog.close();
						that.onReportAnother();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},

		// getResourceText: function (sKey) {
		// 	jQuery.sap.require("jquery.sap.resources");
		// 	var sLocale = sap.ui.getCore().getConfiguration().getLanguage();
		// 	var oBundle = jQuery.sap.resources({
		// 		url: "i18n/i18n.properties",
		// 		locale: sLocale
		// 	});
		// 	return oBundle.getText(sKey);
		// },

		getParentView: function (e) {
			var b = e.getSource();
			while (b && b.getParent) {
				b = b.getParent();
				if (b instanceof sap.ui.core.mvc.View) {
					return b;
				}
			}
			return null;
		},

		addDispositionCodeColumn: function () {
			// this.oColumns.push({
			// 	width: "4rem",
			// 	letter: "Q",
			// 	header: Utils.getResourceText('DispCode'),
			// 	demandPopin: true,
			// 	minScreenWidth: "",
			// 	styleClass: "cellBorderRight cellBorderTop"
			// });
			//this.oColumnModel.setData(this.oColumns);
		},

		removeDispositionCodeColumn: function (letter) {
			var temp = [];
			for (var i = 0; i < this.oColumns.length; i++) {
				if (this.oColumns[i].letter === letter) {
					temp = this.oColumns.splice(i, 1);
					break;
				}
			}
			if (temp.length === 0) {
				// Nothing found 
				temp = this.oColumns;
			}
			this.oColumnModel.setData(temp);
			return temp;
		},

		assignColumnHeadings: function (contract) {
			// Assigns labels to columns based on output from SAP table ZCS_CLAIMS_SCR
			var columnLabelMap = [{
				columnChar: "A",
				labelName: ""
			}, {
				columnChar: "B",
				labelName: "lblDocNum"
			}, {
				columnChar: "C",
				labelName: "lblServType"
			}, {
				columnChar: "D",
				labelName: "lblRef"
			}, {
				columnChar: "E",
				labelName: "lblSuppTxt"
			}, {
				columnChar: "F",
				labelName: "lblServDate"
			}, {
				columnChar: "G",
				labelName: "lblDelDate"
			}, {
				columnChar: "H",
				labelName: "lblOrigSite"
			}, {
				columnChar: "I",
				labelName: "lblOrigSitePcode"
			}, {
				columnChar: "J",
				labelName: "lblDestSite"
			}, {
				columnChar: "K",
				labelName: "lblDestSitePcode"
			}, {
				columnChar: "L",
				labelName: "lblMaterial"
			}, {
				columnChar: "M",
				labelName: "lblReptUnits"
			}, {
				columnChar: "N",
				labelName: "lblContnrId"
			}, {
				columnChar: "O",
				labelName: "lblQuantity"
			}, {
				columnChar: "P",
				labelName: "lblMsrdQuant"
			}, {
				columnChar: "Q",
				labelName: "lblDispCode"
			}, {
				columnChar: "R",
				labelName: "lblVehicleId"
			}, {
				columnChar: "S",
				labelName: "lblVehicleType"
			}, {
				columnChar: "T",
				labelName: "lblRouteNumber"
			}, {
				columnChar: "U",
				labelName: "lblArrivalTime"
			}, {
				columnChar: "W",
				labelName: "lblArrivalDate"
			}, {
				columnChar: "X",
				labelName: "lblEanU"
			}, {
				columnChar: "Y",
				labelName: "lblTBD1"
			}, {
				columnChar: "Z",
				labelName: "lblTBD2"
			}];
			var labels = contract.labels;
			if (labels) {
				var labelKeys = Object.keys(labels);
				for (var i = 0; i < labelKeys.length; i++) {
					if (labelKeys[i].substr(0, 3) === "lbl" && labels[labelKeys[i]] !== "") {
						for (var j = 0; j < columnLabelMap.length; j++) {
							if (columnLabelMap[j].labelName === labelKeys[i]) {
								this.updateColumnHeader(columnLabelMap[j].columnChar, labels[labelKeys[i]]);
							}
						}
					}
				}
			}
			cssa.sp.cssaupldsprdsheet.ColumnModel.refresh(); // eslint-disable-line no-undef
		},

		updateColumnHeader: function (colChar, headerText) {
			for (var i = 0; i < this.oColumns.length; i++) {
				if (colChar === this.oColumns[i].letter) {
					this.oColumns[i].header = headerText;
					break;
				}
			}
		},

		oConfirmationResults: [],

		oColumns: [{
			width: "20rem",
			letter: "",
			header: Utils.getResourceText('Issues'),
			demandPopin: false,
			binding: "",
			minScreenWidth: "",
			styleClass: "" // "noCellBorderRight"
		}, {
			width: "4rem",
			letter: "",
			header: Utils.getResourceText('Status'),
			demandPopin: false,
			binding: "",
			minScreenWidth: "",
			styleClass: "noCellBorderLeft cellBorderRight cellBorderTop"
		}, {
			width: "3rem",
			letter: "",
			header: Utils.getResourceText('Line'),
			demandPopin: false,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight headerBackground" // cellBorderTop"
		}, {
			width: "7rem",
			letter: "", //letter: "A",
			header: Utils.getResourceText('Contract_Number'),
			demandPopin: false,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		}, {
			width: "9rem",
			letter: "", //letter: "B",
			header: Utils.getResourceText('Document_Number'),
			demandPopin: false,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		}, {
			width: "8rem",
			letter: "", //letter: "C",
			header: Utils.getResourceText('Service_Type'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		}, {
			width: "6rem",
			letter: "", //letter: "D",
			header: Utils.getResourceText('BulkNo'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		}, {
			width: "8rem",
			letter: "", //letter: "E",
			header: Utils.getResourceText('Driver'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		}, {
			width: "7rem",
			letter: "", //letter: "F",
			header: Utils.getResourceText('Service_Date'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		}, {
			width: "7rem",
			letter: "", //letter: "G",
			header: Utils.getResourceText('Delivery_Date'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		}, {
			width: "9rem",
			letter: "", //letter: "H",
			header: Utils.getResourceText('Originating_Site_Name'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		}, {
			width: "6rem",
			letter: "", //letter: "I",
			header: Utils.getResourceText('Originating_Site_Postal_Code'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		}, {
			width: "9rem",
			letter: "", //letter: "J",
			header: Utils.getResourceText('Destination_Name'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		}, {
			width: "6rem",
			letter: "", //letter: "K",
			header: Utils.getResourceText('Destination_Postal_Code'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		}, {
			width: "10rem",
			letter: "", //letter: "L",
			header: Utils.getResourceText('Material_Category'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		}, {
			width: "7rem",
			letter: "", //letter: "M",
			header: Utils.getResourceText('Container_Type'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		}, {
			width: "7rem",
			letter: "", //letter: "N",
			header: Utils.getResourceText('Container_ID'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		}, {
			width: "4rem",
			letter: "", //letter: "O",
			header: Utils.getResourceText('Reporting_Quantity'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		}, {
			width: "6rem",
			letter: "", //letter: "P",
			header: Utils.getResourceText('Weight'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		},
		{
				width: "4rem",
				letter: "Q",
				header: Utils.getResourceText('DispCode'),
				demandPopin: true,
				minScreenWidth: "",
				styleClass: "cellBorderRight cellBorderTop"
		},
		{
			width: "8rem",
			letter: "", //letter: "R",
			header: Utils.getResourceText('Vehicle_Id'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		},
		{
			width: "8rem",
			letter: "", //letter: "S",
			header: Utils.getResourceText('Vehicle_Type'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		},
		{
			width: "8rem",
			letter: "", //letter: "T",
			header: Utils.getResourceText('Route_Number'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		},
		{
			width: "10rem",
			letter: "", //letter: "U",
			header: Utils.getResourceText('Driver_Name'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		},
		{
			width: "8rem",
			letter: "", //letter: "V",
			header: Utils.getResourceText('Arrival_Time'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		},
		{
			width: "8rem",
			letter: "", //letter: "W",
			header: Utils.getResourceText('Arrival_Date'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		},
		{
			width: "10rem",
			letter: "", //letter: "X",
			header: Utils.getResourceText('EAN_U'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		},
		{
			width: "10rem",
			letter: "", //letter: "Y",
			header: Utils.getResourceText('TBD1'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		},
		{
			width: "10rem",
			letter: "", //letter: "Z",
			header: Utils.getResourceText('TBD2'),
			demandPopin: true,
			binding: "",
			minScreenWidth: "",
			styleClass: "cellBorderRight cellBorderTop"
		}],

	});
});