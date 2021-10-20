/*global QUnit*/

sap.ui.define([
	"cssa/sp/cssaupldsprdsheet/controller/UploadSpreadsheet.controller"
], function (Controller) {
	"use strict";

	QUnit.module("UploadSpreadsheet Controller");

	QUnit.test("I should test the UploadSpreadsheet controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});