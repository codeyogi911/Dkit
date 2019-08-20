sap.ui.define([
            "mym/srep/controller/BaseController",
            "mym/srep/controller/Assortment/Assortment",
            "mym/srep/controller/helper/Helper",
            "mym/srep/controller/helper/Formatter"
], function (Controller, Assortment, Helper, Formatter) {
            "use strict";
            var oMessagePopover = new sap.m.MessagePopover({
                        items: {
                                    path: "message>/",
                                    template: new sap.m.MessageItem({
                                                title: "{message>message}",
                                                subtitle: "{message>additionalText}",
                                                groupName: {
                                                            parts: [{
                                                                        path: 'message>controlIds'
                                                            }],
                                                            formatter: this.getGroupName
                                                },
                                                // activeTitle: {
                                                //         parts: [{
                                                //                     path: 'message>controlIds'
                                                //         }],
                                                //         formatter: this.isPositionable
                                                // },
                                                type: "{message>type}",
                                                description: "{message>message}"
                                    })
                        }
            });
            var textBundle = Helper.getTextBundle();
            return Controller.extend("mym.srep.controller.dynamicBooking.CreateBooking", {
                        _formFragments: {},
                        _customODataModels: {},
                        onInit: function () {
                                    this._MessageManager = sap.ui.getCore().getMessageManager();
                                    var oConfigModel = new sap.ui.model.json.JSONModel();
                                    this.getView().setModel(oConfigModel, "config");
                                    var self = this;
                                    this.getView().setModel(new sap.ui.model.json.JSONModel(), 'createBooking');
                                    this.getView().setModel(new sap.ui.model.json.JSONModel({
                                                "messages": []
                                    }, true), "viewModel2");
                                    this.oView.addEventDelegate({
                                                onAfterShow: function () {
                                                            if (!self.oAssort) {
                                                                        self.oAssort = new Assortment();
                                                            }
                                                            self._initializeView();
                                                }
                                    });
                        },
                        getGroupName: function (sControlId) {
                                    // the group name is generated based on the current layout
                                    // and is specific for each use case
                                    var oControl = sap.ui.getCore().byId(sControlId);

                                    if (oControl) {
                                                var sFormSubtitle = oControl.getParent().getParent().getTitle().getText(),
                                                            sFormTitle = oControl.getParent().getParent().getParent().getTitle();

                                                return sFormTitle + ", " + sFormSubtitle;
                                    }
                        },

                        isPositionable: function (sControlId) {
                                    // Such a hook can be used by the application to determine if a control can be found/reached on the page and navigated to.
                                    return sControlId === "" ? false : true;
                        },
                        onAfterRendering: function () {
                                    this.getView().setModel(this._MessageManager.getMessageModel(), "message");
                                    this.getView().byId("messagePopoverBtn").addDependent(oMessagePopover);
                                    if (this.getView().getModel('viewModel')) {
                                                return;
                                    }
                                    var that = this;
                                    var viewModel = new sap.ui.model.json.JSONModel();
                                    var mockMode = true;
                                    if (mockMode) {
                                                var jsonTemplate = new sap.ui.model.json.JSONModel(jQuery.sap.getModulePath("mym/srep/model", "/viewConfig.json"));
                                                jsonTemplate.attachRequestCompleted(function (oEvent) {
                                                            viewModel.setData(oEvent.getSource().getData().content);
                                                            that._getCustomODATAModels(oEvent.getSource().getData());
                                                            that.getView().setModel(viewModel, "viewModel");
                                                            that._initializeView();
                                                });
                                    } else {
                                                this._getAndBuildViewContent();
                                    }
                        },
                        _getCustomODATAModels: function (data) {
                                    if (!data || !data.hasOwnProperty('backEndServices') || data.backEndServices.length < 0) {
                                                return;
                                    }
                                    var that = this;
                                    data.backEndServices.forEach(function (srv) {
                                                if (srv.hasOwnProperty('name') && srv.hasOwnProperty('url')) {
                                                            var service = new sap.ui.model.odata.v2.ODataModel(srv.url);
                                                            try {
                                                                        var md = service.getServiceMetadata();
                                                                        that._customODataModels[srv.name] = {
                                                                                    "model": service,
                                                                                    "metaData": md
                                                                        };
                                                            } catch (error) {
                                                                        // console.log("Error while trying to fetch metadata from " + srv.url);
                                                            }
                                                }
                                    });
                        },
                        _getAndBuildViewContent: function () {
                                    var that = this;
                                    var filtersTab = [];
                                    var filter = new sap.ui.model.Filter("Ui5view", sap.ui.model.FilterOperator.EQ, "CREATEBOOKING");
                                    filtersTab.push(filter);
                                    this.getView().getModel().read("/ViewSet", {
                                                filters: filtersTab,
                                                success: function (D) {
                                                            if (D.results.length === 1) {
                                                                        that._startBuilding(D.results[0]);
                                                            }
                                                },
                                                error: function (E) {
                                                            sap.m.MessageBox.error(that._oBundle.getText('err_httpCustomizing'));
                                                }
                                    });
                        },
                        _startBuilding: function (obj) {
                                    var base64 = obj.Json;
                                    var json = JSON.parse(atob(base64));
                                    var viewModel = new sap.ui.model.json.JSONModel();
                                    viewModel.setData(json);
                                    this.getView().setModel(viewModel, "viewModel");
                                    this._initializeView();
                        },
                        _initializeView: function () {
                                    this.getView().getModel("config").setData({
                                                reviewMode: false,
                                                listMode: sap.m.ListMode.MultiSelect,
                                                addressEditMode: false,
                                                selectedTab: "main",
                                                showNextButton: true,
                                                showBackButton: false,
                                                showConfirmButton: false,
                                                showFragment: false
                                    });
                                    var tabBar = this.getView().byId('tabBar');
                                    tabBar.getItems().forEach(function (tab, index) {
                                                var enabled = false;
                                                if (index === 0) {
                                                            enabled = true;
                                                            tabBar.setSelectedKey(tab.getKey());
                                                }
                                                tab.setEnabled(enabled);
                                    });
                        },
                        removeMessageFromTarget: function (sTarget) {
                                    this._MessageManager.getMessageModel().getData().forEach(function (oMessage) {
                                                if (oMessage.target === sTarget) {
                                                            this._MessageManager.removeMessages(oMessage);
                                                }
                                    }.bind(this));
                        },
                        _validateInput: function (oControl) {
                                    var oModel = oControl.getModel("viewModel2"),
                                                createBookingModel = oControl.getModel('createBooking'),
                                                sPath = oControl.getBindingPath("selectedKey") ? oControl.getBindingPath("selectedKey") : oControl.getBindingPath(
                                                            "dateValue"),
                                                valid;
                                    sPath = sPath ? sPath : oControl.getBindingPath("value");
                                    if (sPath) {
                                                valid = (!createBookingModel.getProperty(sPath) || createBookingModel.getProperty(sPath) === "") ? false : true;
                                    } else {
                                                valid = oControl.getTokens().length > 0;
                                    }
                                    this.removeMessageFromTarget(sPath);
                                    if (valid) {
                                                oControl.setValueState("None");
                                    } else {
                                                oControl.setValueState("Error");
                                                this._MessageManager.addMessages(
                                                            new sap.ui.core.message.Message({
                                                                        message: "A mandatory field is required",
                                                                        type: sap.ui.core.MessageType.Error,
                                                                        additionalText: oControl.getLabels()[0].getText(),
                                                                        target: sPath,
                                                                        processor: this.getView().getModel("createBooking")
                                                            })
                                                );
                                    }
                                    this._showDependents(oControl, oModel, valid);
                                    return valid;
                        },
                        _showDependents: function (oSource, oModel, valid) {
                                    var dependents = oModel.getProperty("/" + oSource.getId() + "/dependents");
                                    for (var index in dependents) {
                                                var dependsOn = oModel.getProperty("/" + dependents[index] + "/dependsOn");
                                                if (dependsOn) {
                                                            dependsOn.forEach(function (element) {
                                                                        valid = valid && sap.ui.getCore().byId(element).getSelectedKey() !== "";
                                                            });
                                                }
                                                oModel.setProperty("/" + dependents[index] + "/visible", valid);
                                    }
                        },
                        onChange: function (oEvent) {
                                    if (this._validateInput(oEvent.getSource()))
                                                switch (oEvent.getSource().getId()) {
                                                case "shiptoparty":
                                                            // if (this._validateInput(oEvent.getSource())) {
                                                            this._setShipToData(oEvent);
                                                            // }
                                                            break;
                                                case "procedure":
                                                            // this.assortmentHelpRequest();
                                                            this._validateInput(oEvent.getParent());
                                                            break;
                                                case "hospital":
                                                            // if (this._validateInput(oEvent.getSource())) {
                                                            this.handleHospitalChange(oEvent);
                                                            // }
                                                            this._clearDependentValues(oEvent);
                                                            break;
                                                }
                        },
                        _clearDependentValues: function (oEvent) {
                                    // clear dependent values
                                    // sap.ui.getCore().byId("shiptoparty");
                                    var dependents = this.getView().getModel('viewModel2').getProperty("/" + oEvent.getSource().getId() + "/dependents");
                                    // var that = this;
                                    dependents.forEach(function (sDependentId) {
                                                var dependent = sap.ui.getCore().byId(sDependentId);
                                                if (dependent) {
                                                            if (typeof dependent.setValue === 'function') {
                                                                        dependent.setValue('');
                                                            }
                                                            if (typeof dependent.setSelectedKey === 'function') {
                                                                        dependent.setSelectedKey('');
                                                            }
                                                }
                                    });
                        },
                        _setShipToData: function (evt) {
                                    var pathSuggestionItem = evt.getSource().getBindingInfo('suggestionItems').path + "('" + evt.getSource().getSelectedKey() + "')";
                                    var shipToFullData = this.getView().getModel().getProperty(pathSuggestionItem);
                                    var jsonModelPath = evt.getSource().getBindingInfo('selectedKey').binding.sPath;
                                    var split = jsonModelPath.split("/");
                                    jsonModelPath = split.slice(0, split.length - 1).join("/") + "/";
                                    var shipToPartnerJson = this.getView().getModel('createBooking').getProperty(jsonModelPath);
                                    if (!shipToPartnerJson.Parvw === "WE" || !shipToFullData) return;
                                    shipToPartnerJson.Name1 = shipToFullData.Name1;
                                    shipToPartnerJson.Land1 = shipToFullData.Land1;
                                    shipToPartnerJson.Ort01 = shipToFullData.Ort01;
                                    shipToPartnerJson.Pstlz = shipToFullData.Pstlz;
                                    shipToPartnerJson.Stras = shipToFullData.Stras;
                                    if (this._formFragments.shipToDisplay) {
                                                this._formFragments.shipToDisplay.bindElement(jsonModelPath);
                                    }
                                    this.getView().getModel('config').setProperty('/showFragment', true);
                        },
                        handleHospitalChange: function (oEvt) {
                                    var sSelectedKey = oEvt.getSource().getSelectedKey();
                                    var dependents = oEvt.getSource().getModel("viewModel2").getProperty("/" + oEvt.getSource().getId() + "/dependents");
                                    for (var index in dependents) {
                                                var dependent = sap.ui.getCore().byId(dependents[index]);
                                                if (dependent) {
                                                            var selectedKeyBinding = dependent.getBinding("selectedKey");
                                                            if (selectedKeyBinding) {
                                                                        this.getView().getModel('createBooking').setProperty(selectedKeyBinding.sPath, "");
                                                                        sap.ui.getCore().byId(dependents[index]);
                                                                        var split = selectedKeyBinding.sPath.split("/");
                                                                        var path = split.slice(0, split.length - 1).join("/") + "/";
                                                                        var data = this.getView().getModel('createBooking').getProperty(path);
                                                                        if (data.hasOwnProperty("Parvw")) {
                                                                                    this.getView().getModel('createBooking').setProperty(path, {
                                                                                                "Parvw": data.Parvw
                                                                                    });
                                                                        }
                                                            } else {
                                                                        var valueBinding = dependent.getBinding("value");
                                                                        if (valueBinding) {
                                                                                    this.getView().getModel('createBooking').setProperty(valueBinding.sPath, "");
                                                                        }
                                                            }
                                                }
                                                switch (dependents[index]) {
                                                case "shiptoparty":
                                                            var shipToParty = sap.ui.getCore().byId(dependents[index]);
                                                            var bindInfo = {
                                                                        path: "/ShipToPartySet",
                                                                        filters: [new sap.ui.model.Filter({
                                                                                    path: "Kunnr",
                                                                                    operator: sap.ui.model.FilterOperator.EQ,
                                                                                    value1: sSelectedKey
                                                                        })],
                                                                        template: new sap.ui.core.ListItem(oEvt.getSource().getModel("viewModel2").getProperty("/" + dependents[index] +
                                                                                    "/listItemSettings"))
                                                            };
                                                            shipToParty.bindAggregation("suggestionItems", bindInfo);
                                                            // if (shipToParty) {
                                                            //         if (typeof shipToParty.setValue === 'function') {
                                                            //                     shipToParty.setValue("");
                                                            //                     shipToParty.setSelectedKey("");
                                                            //         }
                                                            //         shipToParty.bindAggregation("suggestionItems", bindInfo);
                                                            // }
                                                            break;
                                                }

                                    }
                        },
                        tabFactory: function (sId, oContext) {
                                    var contextData = oContext.getObject(),
                                                oTabFilter = new sap.m.IconTabFilter(contextData.id, contextData.settings);
                                    if (contextData.content && contextData.content.type === "Fragment") {
                                                var oContent = this._getFormFragment(contextData.content.name, contextData.id);
                                                oTabFilter.addContent(oContent);
                                    }
                                    this._MessageManager.registerObject(oTabFilter, true);
                                    return oTabFilter;
                        },
                        formFactory: function (sId, oContext) {
                                    var fields,
                                                viewModel = this.getView().getModel("viewModel2"),
                                                contextData = oContext.getObject(),
                                                mSettings = contextData.settings,
                                                id = contextData.id;
                                    viewModel.setProperty("/" + id, oContext.getObject());
                                    switch (contextData.type) {
                                    case "Fragment":
                                                fields = sap.ui.xmlfragment(this.getView().getId(), "mym.srep.view." + contextData.name, this);
                                                this._formFragments[contextData.id] = fields;
                                                break;
                                    case "Input":
                                                fields = new sap.m.Input(id);
                                                if (contextData.itemsPath) {
                                                            var bindingInfo = {
                                                                        path: contextData.itemsPath,
                                                                        template: new sap.ui.core.ListItem(contextData.listItemSettings)
                                                            };
                                                            if(contextData.customBackendService && this._customODataModels[contextData.customBackendService] && this._customODataModels[contextData.customBackendService].model){
                                                                        bindingInfo.model = this._customODataModels[contextData.customBackendService].model;
                                                            }
                                                            
                                                            fields.bindAggregation("suggestionItems", bindingInfo);
                                                            if (!contextData.partnerFunction) {
                                                                        if (contextData.backendField) {
                                                                                    if (!contextData.review) {
                                                                                                fields.bindProperty("selectedKey", "createBooking>/" + contextData.backendField);
                                                                                    }
                                                                                    fields.bindProperty("value", "viewModel2>/" + contextData.backendField + "value");
                                                                        }
                                                            } else {
                                                                        if (contextData.review) {
                                                                                    fields.bindProperty("value", "viewModel2>/" + contextData.backendField + contextData.partnerFunction + "value");
                                                                        } else {
                                                                                    var createBookingModelData = this.getView().getModel('createBooking').getData();
                                                                                    createBookingModelData.BookingToPartner = createBookingModelData.BookingToPartner ? createBookingModelData.BookingToPartner : [];
                                                                                    var curLength = createBookingModelData.BookingToPartner.length;
                                                                                    createBookingModelData.BookingToPartner.push({
                                                                                                Parvw: contextData.partnerFunction
                                                                                    });
                                                                                    fields.bindProperty("selectedKey", "createBooking>/BookingToPartner/" + curLength + "/Kunnr");
                                                                                    fields.bindProperty("value", "viewModel2>/" + contextData.backendField + contextData.partnerFunction + "value");
                                                                                    fields.bindElement("createBooking>/BookingToPartner/" + curLength);
                                                                        }
                                                            }
                                                } else {
                                                            if (contextData.backendField) {
                                                                        fields.bindProperty("value", "createBooking>/" + contextData.backendField);
                                                            }
                                                }
                                                fields.attachChange(this.onChange.bind(this));
                                                break;
                                    case "Date":
                                                fields = new sap.m.DatePicker(id);
                                                fields.bindProperty("value", "viewModel2>/" + contextData.backendField + "value");
                                                fields.bindProperty("dateValue", "viewModel2>/" + contextData.backendField + "value");
                                                var date = new Date();
                                                date = new Date(date.setTime(date.getTime() * 86400000));
                                                fields.setDateValue(date);
                                                if (contextData.backendField) {
                                                            fields.bindProperty("dateValue", "createBooking>/" + contextData.backendField);
                                                }
                                                fields.attachChange(this.onChange.bind(this));
                                                break;
                                    case "Select":
                                                fields = new sap.m.Select(id);
                                                if (contextData.itemsPath) {
                                                            fields.bindAggregation("items", {
                                                                        path: contextData.itemsPath,
                                                                        template: new sap.ui.core.ListItem(contextData.listItemSettings)
                                                            });
                                                            if (contextData.backendField) {
                                                                        fields.bindProperty("selectedKey", "createBooking>/" + contextData.backendField);
                                                            }
                                                }
                                                break;
                                    case "MultiInput":
                                                fields = new sap.m.MultiInput(id);
                                                fields.attachValueHelpRequest(null, this.assortmentHelpRequest.bind(this));
                                                fields.attachTokenUpdate(this.onChange.bind(this));
                                                break;
                                    case "TextArea":
                                                fields = new sap.m.TextArea(id);
                                                fields.bindProperty("value", "createBooking>/" + contextData.backendField);
                                                break;
                                    }
                                    fields.bindElement("viewModel2>/" + contextData.backendField + "value");
                                    for (var key in mSettings) {
                                                if (mSettings.hasOwnProperty(key)) {
                                                            //no a property from prototype chain     
                                                            fields.bindProperty(key, "viewModel2>/" +
                                                                        id + "/settings/" + key);
                                                }
                                    }
                                    var oformElement = new sap.ui.layout.form.FormElement({
                                                fields: fields
                                    });
                                    /*if (!viewModel.valueStates) {
                                                viewModel.valueState = [];
                                    }*/
                                    // if (typeof fields.setValueState === "function") {
                                    //         viewModel.setProperty('/' + contextData.backendField + "valueState", {
                                    //                     valueState: "Error",
                                    //                     valueStateText: "Fsfdaoijso;"
                                    //         });
                                    //         viewModel.setProperty('/' + contextData.backendField + "valueState", "Error");
                                    //         viewModel.setProperty('/' + contextData.backendField + "valueStateText", "Errortext");
                                    //         debugger;
                                    //         fields.bindProperty('valueState', "viewModel2>" + contextData.backendField + "valueState");
                                    //         fields.bindProperty('valueStateText', "viewModel2>" + contextData.backendField + "valueStateText");
                                    // }

                                    oformElement.bindProperty("label", "viewModel2>/" + id + "/label");
                                    oformElement.bindProperty("visible", "viewModel2>/" + id + "/visible");
                                    return oformElement;
                        },
                        _getFormFragment: function (sFragmentName, tabId) {
                                    var oFormFragment = this._formFragments[tabId];
                                    if (oFormFragment) {
                                                return oFormFragment;
                                    }
                                    oFormFragment = sap.ui.xmlfragment(this.getView().getId(), "mym.srep.view." + sFragmentName, this);
                                    this._formFragments[tabId] = oFormFragment;
                                    return this._formFragments[tabId];
                        },
                        assortmentHelpRequest: function () {
                                    if (this.oAssort) {
                                                this.oAssort.initializeSelected();
                                    }
                                    var oBusyDialog = this.byId("BusyDialog");
                                    oBusyDialog.open();
                                    this.oAssort.showDialog(function (sel) {
                                                oBusyDialog.close();
                                                var input = sap.ui.getCore().byId("procedure");
                                                input.destroyTokens();
                                                $.each(sel, function (ind, selVal) {
                                                            input.addToken(new sap.m.Token({
                                                                        key: selVal.Objekt,
                                                                        text: selVal.Ktext,
                                                                        editable: false
                                                            }));
                                                });
                                    });
                        },
                        handleMessagePopoverPress: function (oEvent) {
                                    oMessagePopover.toggle(oEvent.getSource());
                        },
                        prepareAsmntNavigation: function () {
                                    var filters = [];
                                    var tokens = sap.ui.getCore().byId("procedure").getTokens();
                                    if (!tokens) {
                                                return;
                                    }
                                    tokens.map(function (obj) {
                                                var key = obj.getKey();
                                                if (key) {
                                                            var filter = new sap.ui.model.Filter("Vbeln", sap.ui.model.FilterOperator.EQ, key);
                                                            filters.push(filter);
                                                }
                                    });
                                    var that = this;
                                    this.getView().getModel().read("/SalesOrderItemSet", {
                                                filters: filters,
                                                success: function (D) {
                                                            that.createBooking(D.results);
                                                },
                                                error: function (E) {
                                                            sap.m.MessageBox.error("Error while fetching Assortment Items");
                                                }
                                    });
                        },
                        handleAddressEditPress: function () {
                                    this.getView().getModel("config").setProperty("/addressEditMode", !this.getView().getModel("config").getProperty("/addressEditMode"));
                        },
                        onConfirm: function (evt) {
                                    this.createBooking();
                                    this._clearModelData();
                        },
                        onNext: function (evt) {
                                    var tabBar = this.getView().byId('tabBar');
                                    if (!this._checkMandatoryFields()) {
                                                return;
                                    }
                                    this.getView().getModel("config").setProperty("/addressEditMode", false);
                                    var nextTabIndex = this._getCurrentTabIndex(tabBar) + 1;
                                    var nextTab = tabBar.getItems()[nextTabIndex];
                                    if (nextTab.getKey() === "assortments") {
                                                this.prepareAsmntNavigation();
                                    }
                                    if (nextTab.getKey() === "review") {
                                                this.getView().getModel("config").setProperty('/reviewMode', true);
                                                this.getView().getModel('config').setProperty('/showNextButton', false);
                                                this.getView().getModel('config').setProperty('/showConfirmButton', true);
                                    }
                                    nextTab.setEnabled(true);
                                    tabBar.setSelectedKey(nextTab.getKey());
                                    this.getView().getModel('config').setProperty('/showBackButton', true);
                        },
                        onBack: function (evt) {
                                    var tabBar = this.getView().byId('tabBar');
                                    var currentIndex = this._getCurrentTabIndex(tabBar);
                                    tabBar.getItems()[currentIndex].setEnabled(false);
                                    var previousIndex = currentIndex - 1;
                                    if (previousIndex < 0) {
                                                return;
                                    } else if (previousIndex === 0) {
                                                this.getView().getModel('config').setProperty('/showBackButton', false);
                                    }
                                    this.getView().getModel('config').setProperty('/showConfirmButton', false);
                                    this.getView().getModel("config").setProperty('/reviewMode', false);
                                    var prevTab = tabBar.getItems()[previousIndex];
                                    tabBar.setSelectedKey(prevTab.getKey());
                                    this.getView().getModel('config').setProperty('/showNextButton', true);
                        },
                        _checkMandatoryFields: function () {
                                    var tabBar = this.getView().byId('tabBar'),
                                                selectedTabKey = tabBar.getSelectedKey(),
                                                viewModelData = this.getView().getModel('viewModel').getData(),
                                                // createBookingData = this.getView().getModel('createBooking').getData(),
                                                messages = [],
                                                that = this;

                                    var selectedTab = viewModelData.tabs.filter(function (tab) {
                                                if (tab.id === selectedTabKey) return tab;
                                    })[0];
                                    if (selectedTab.content.elements) {
                                                selectedTab.content.elements.forEach(function (element) {
                                                            var oFormElement = sap.ui.getCore().byId(element.id);
                                                            if (element.settings && element.settings.required && oFormElement.getParent().getVisible())
                                                                        that._validateInput(oFormElement);
                                                });
                                    }
                                    var messagesToRemove = [];
                                    messages = this.getView().getModel('message').getData();
                                    messages.forEach(function (message) {
                                                if (message.type !== "Error") {
                                                            messagesToRemove.push(message);
                                                }
                                    });
                                    this._MessageManager.removeMessages(messagesToRemove);
                                    if (messages.length > 0) {
                                                setTimeout(function () {
                                                            oMessagePopover.openBy(this.getView().byId("messagePopoverBtn"));
                                                }.bind(this), 100);
                                                return false;
                                    }
                                    return true;
                        },
                        _getCurrentTabIndex: function (tabBar) {
                                    var selectedTabIndex,
                                                selectedTabKey = tabBar.getSelectedKey();
                                    var continueLoop = true;
                                    for (var i = 0; i < tabBar.getItems().length && continueLoop; i++) {
                                                if (tabBar.getItems()[i].getKey() === selectedTabKey) {
                                                            selectedTabIndex = i;
                                                            continueLoop = false;
                                                }
                                    }
                                    return selectedTabIndex;
                        },
                        createBooking: function (items) {
                                    var oModel = this.getView().getModel();
                                    var self = this;
                                    var oBusyDialog = this.byId("BusyDialog");
                                    oBusyDialog.open();
                                    var createMode = this.getView().getModel("config").getData().reviewMode;

                                    items = createMode || !items ? this._formFragments['assortments'].getSelectedContexts() : items;
                                    var createStructureModified = this.prepareModelForODataCall(items);
                                    oModel.create("/BookingSet", createStructureModified, {
                                                success: createMode ? self.onSuccessBookingCreate.bind(self) : self.onSuccessBookingCreateATP.bind(self),
                                                error: function (e) {
                                                            sap.m.MessageBox.error("HTTP Request Failed!");
                                                            oBusyDialog.close();
                                                }
                                    });
                        },
                        onSuccessBookingCreate: function (d) {
                                    var self = this;
                                    this.byId("BusyDialog").close();
                                    sap.m.MessageBox.success(textBundle.getText("bookingCreated", parseInt(d.Zzlresn, 10)), {
                                                onClose: function () {
                                                            self.getOwnerComponent().getModel("createBooking").setData({});
                                                            self.getOwnerComponent().getRouter().navTo("main", null, true);
                                                }
                                    });
                        },
                        onSuccessBookingCreateATP: function (d) {
                                    var self = this;
                                    this.byId("BusyDialog").close();
                                    var items = d.BookingToBookingItem;
                                    if (!items) {
                                                return;
                                    }
                                    items.results.forEach(function (o) {
                                                if (o.Mattyp !== "1") {
                                                            o.Available = "W";
                                                            o.Mattyp = textBundle.getText("mattyp_single");
                                                } else {
                                                            o.Mattyp = textBundle.getText("mattyp_normal");
                                                }
                                    });
                                    var model = self.getView().getModel("assortments");
                                    model.setData({
                                                SalesOrderItems: items.results,
                                                SalesOrderItemsSelected: items.results
                                    });
                                    var tabbar = this.getView().byId('tabBar');
                                    var oTable = this._formFragments[tabbar.getSelectedKey()];
                                    if (oTable) {
                                                oTable.attachEvent("selectionChange", null, function (evt) {
                                                            //model.getData().SalesOrderItemsSelected = evt.getSource().getSelectedContexts().map(function (obj) {
                                                            var SalesOrderItemsSelected = evt.getSource().getSelectedContexts().map(function (obj) {
                                                                        return obj.getObject();
                                                            });
                                                            model.setProperty('/SalesOrderItemsSelected', SalesOrderItemsSelected);
                                                            this.getView().getModel('createBooking').getData().BookingToBookingItem = model.getData().SalesOrderItemsSelected;
                                                }.bind(self));
                                    }
                                    oTable.selectAll(true);
                        },
                        prepareModelForODataCall: function (items) {
                                    var createStructure = this.getView().getModel('createBooking').getData();
                                    createStructure.BookingToBookingItem = this.convertBItemsDoubleToEDM(this.buildItems(items)); // Fetch items from Assortment and convert the ints to string for odata service
                                    var createStructureModified = jQuery.extend(true, {}, createStructure);
                                    if (createStructureModified.notes) {
                                                createStructureModified.BookingToNotes = [{
                                                            Note1: createStructureModified.notes
                                                }];
                                    }
                                    delete createStructureModified.notes;
                                    createStructureModified.Zfields = JSON.stringify(createStructure.Zfields);
                                    createStructureModified.Asmnt = this.oAssort.selectedAssortList.length > 0 ? this.oAssort.selectedAssortList[0].Objekt : '';
                                    createStructureModified.Simulation = !this.getView().getModel("config").getData().reviewMode;
                                    createStructureModified.Odate = this.createDateAsUTC(new Date(createStructureModified.Odate));
                                    createStructureModified.Vdate = this.createDateAsUTC(new Date(createStructureModified.Vdate));
                                    return createStructureModified;
                        },
                        buildItems: function (itemsIn) {
                                    var items = [];
                                    var item = {};
                                    itemsIn.map(function (o) {
                                                item = {};
                                                var prop = o.hasOwnProperty('Matnr');
                                                item.Matnr = prop ? o.Matnr : o.getObject().Matnr;
                                                item.Menge = prop ? parseInt(o.Zmeng, 10) : parseInt(o.getObject().Menge, 10);
                                                item.Meins = prop ? o.Zieme : o.getObject().Meins;
                                                if (prop) {
                                                            item.Mattyp = o.Mattyp;
                                                }
                                                item.Asmnt = prop ? (o.Asmnt && o.Asmnt !== "" ? o.Asmnt : o.Vbeln) : (o.getObject().Asmnt && o.getObject().Asmnt !== "" ? o.getObject()
                                                            .Asmnt : o.getObject().Vbeln);
                                                items.push(item);
                                    });
                                    return items;
                        },
                        convertBItemsDoubleToEDM: function (items) {
                                    var i;
                                    for (i = 0; i < items.length; i++) {
                                                items[i].Menge = items[i].Menge.toString();
                                    }
                                    return items;
                        },
                        createDateAsUTC: function (date) {
                                    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()));
                        },
                        onNavBack: function () {
                                    this.confirmExit();
                        },
                        confirmExit: function () {
                                    var self = this;
                                    sap.m.MessageBox.confirm("Do want to navigate to main screen?", function (oAction) {
                                                if (oAction === "OK") {
                                                            self._clearModelData();
                                                            self.getOwnerComponent().getRouter().navTo("main", null, true);
                                                }
                                    });
                        },
                        _clearModelData: function () {
                                    var modelData = this.getView().getModel('createBooking').getData();
                                    for (var obj in modelData) {
                                                if (modelData[obj] instanceof Array) {
                                                            modelData[obj] = modelData[obj].map(function (arrObj) {
                                                                        return {
                                                                                    Parvw: arrObj.Parvw
                                                                        };
                                                            });
                                                } else {
                                                            delete modelData[obj];
                                                }
                                    }
                                    var viewData = this.getView().getModel('viewModel2').getData();
                                    for (var obj in viewData) {
                                                var viewElement = sap.ui.getCore().byId(viewData[obj].id);
                                                if (viewElement) {
                                                            if (typeof viewElement.setSelectedKey === "function") {
                                                                        viewElement.setSelectedKey("");
                                                            }
                                                            if (typeof viewElement.setValue === "function") {
                                                                        viewElement.setValue("");
                                                            }
                                                            if (typeof viewElement.setDateValue === "function") {
                                                                        var date = new Date();
                                                                        date = new Date(date.setTime(date.getTime() + obj.dateOffset * 86400000));
                                                                        viewElement.setDateValue(date);
                                                            }
                                                            if (typeof viewElement.destroyTokens === "function") {
                                                                        viewElement.destroyTokens();
                                                            }
                                                }
                                                for (var index in viewData[obj].dependents) {
                                                            this.getView().getModel("viewModel2").setProperty("/" + viewData[obj].dependents[index] + "/visible", false);
                                                }
                                    }
                                    var model = this.getView().getModel("assortments");
                                    model.setData({
                                                SalesOrderItems: [],
                                                SalesOrderItemsSelected: []
                                    });
                        }
            });
});