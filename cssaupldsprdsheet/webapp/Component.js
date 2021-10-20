sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"sap/ui/model/json/JSONModel",
	"cssa/sp/cssaupldsprdsheet/model/models"
], function (UIComponent, Device, JSONModel, models) {
	"use strict";

	return UIComponent.extend("cssa.sp.cssaupldsprdsheet.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			// Initialise primary model
			var oModel = new JSONModel({});
			cssa = cssa || {};
			cssa.sp = cssa.sp || {};
			cssa.sp.cssaupldsprdsheet = cssa.sp.cssaupldsprdsheet || {};
			cssa.sp.cssaupldsprdsheet.ContractsModel = oModel;
			cssa.sp.cssaupldsprdsheet.bundle = this.getModel("i18n").getResourceBundle();
		}
	});
});