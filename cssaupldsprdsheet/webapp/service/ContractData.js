sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {

		contractData: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			oModel.setData({
				"ContractData": {
					"contractItems": [],
					"dbiContracts": [{
						"descr": "Audit Company  - AUDITC_FIB",
						"telf1": "AUDITC_FIB",
						"ebeln": "4700002060",
						"bsart": "ZQ",
						"ekgrp": "009",
						"lifnr": "0000383557"
					}, {
						"descr": "Audit Company  - AUDITD_SIN",
						"telf1": "AUDITD_SIN",
						"ebeln": "4700002064",
						"bsart": "ZQ",
						"ekgrp": "009",
						"lifnr": "0000383557"
					}, {
						"descr": "Audit Company  - AUDITC_FIB",
						"telf1": "AUDITC_FIB",
						"ebeln": "4700002065",
						"bsart": "ZQ",
						"ekgrp": "009",
						"lifnr": "0000383557"
					}, {
						"descr": "Audit Company  - AUDITC_FIB",
						"telf1": "AUDITC_FIB",
						"ebeln": "4700002066",
						"bsart": "ZQ",
						"ekgrp": "009",
						"lifnr": "0000383557"
					}],
					"contracts": [],
					"validCsiteZc": []
				}
			});
			return oModel;
		}

	};
});