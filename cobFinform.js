// ==UserScript==
// @name         Finform COB
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  try to take over the world!
// @author       ntai
// @match        https://test1-desk.finform.ch/*
// @match        http://localhost:8081/ivy/*
// @match        http://dev2-desk.axonivy.io/ivy/*
// @match        https://desk.finform.ch/ivy/*

// @resource     ballon https://cdnjs.cloudflare.com/ajax/libs/balloon-css/0.5.0/balloon.min.css 
// @require      https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.26.0/babel.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.9.0/underscore-min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/chance/1.0.16/chance.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.10/lodash.min.js
// @grant               GM_listValues
// @grant               GM_registerMenuCommand
// @grant               GM_log
// @grant               GM_addStyle
// @grant               GM_getResourceText
// ==/UserScript==

var CONST = {
    envs: {
        local:  [ 
            /^http.?:\/\/localhost:\d{4}\/ivy.*$/gm
        ],
        test: [
            /^http.?:\/\/.*10.124.1.75:\d{4}\/ivy.*$/gm,
            /^http.?:\/\/.test1-desk\.finform\.ch\/.*$/gm
        ]
    },
    tabs: {
        accountHolder: '[id*="accountHolderTabView"]',
        product: '[id*="productTabView"]',
        signingRight: '[id*="signingRightTabView"]'
    },
    businesses: {
        cob: [
            /^http.?:\/\/.*\/ivy.*\/DataGatheringPage.xhtml$/gm
      ]
    },
    buttons: [{
        active: true,
        id: 'accountHolder',
        text: '',
        event: onAccountHolderFillData,
        business: 'cob',
        icon: 'fa fa-user-circle-o',
        tooltip: 'Fill Account Holder Data'
    },
    {
        active: true,
        id: 'product',
        text: '',
        event: onProductFillData,
        business: 'cob',
        icon: 'fa fa-th-large',
        tooltip:'Fill Product Data'
    }
]
};
var COB_DATA = {
    accountHolder1: {
        personalData: {
            customSalutation: '1',            
            titleForSelectMenu: '1',
            nationality: 'CH',
            homeTown: 'Lucens',
            nationalityItemValue: 'CH',
            birthDate: '20.10.1990',
            street: 'Schloessli Schoenegg',
            addressHouseNo: '6004',
            zipCode: '8000',
            city: 'Zürich',
            customMaritalStatus: '1',
            legalStatus: '2',
            phoneNumber: "+41781234567",
            identificationType: '1',
            identificationNumber:'S0004156',
            authoriy:'Zurich ZH',
            dateOfIssue: '10.10.1995',
            dateOfExp: '20.10.2030',
            nokReason: '1'
        },
        questionnaire: {
            beneficialOwner: 'checked',
            isHaveAUsCitizen: 'checked',
            isBornInUS: 'checked',
            isInPossessionOfUSGreenCard : 'checked',
            meetTheSubstantialPresenceTest : 'checked',
            isThereAnyOtherReason: 'checked'
        }

    },
    product1:{
        productData: {
            productCategory: '1',
            productType: '1'
        }
    } ,
    signingRight:{
        regularType: 'checked',
        authorisationType: 'checked'
    }
};

const templates = {
    buttons: {
        normal: {
            data: { id: '', text: '', icon:'', tooltip:'' },
            get html() {
                return `
                <button class="btn-fill btn btn-primary" 
                data-balloon="${this.data.tooltip}" data-balloon-pos="right" id="${this.data.id}">
                    <span  class="${this.data.icon}"></span>
                    <span class="btn-text">${this.data.text}</span>
                </button>
                `;
            }
        }
    },
    panel: {
        data: { display: '', icon: '' },
        get html() {
            return `
            <div id="panel-wrapper-slide">
            <div id="panel-wrapper" class="panel-wrapper panel ${this.data.display}">  
            </div>                              
            </div>
            `;
        }
    }
};

(function () {
    createPanel();
    createButtons();  
})();

GM_addStyle(GM_getResourceText('ballon'));
GM_addStyle(`
.btn-fill {
    text-align: center;
    vertical-align: middle;
    text-decoration: none;
    margin: 15px 13px;
    border-radius: 50%;
    width: 30px ;
    height: 30px;
    font-size: 15px;
    background: #F0F0F0;
    color: #282828;
    margin-left:auto;
    margin-right:auto;
    display:block;
  }
  

  
.btn-fill:hover {
    background: #A8CB17;
    cursor:pointer;
  }
 
.panel-wrapper {
    padding: 0px;
    font-weight: 500;
    -webkit-box-shadow: -1px 0px 11px -1px rgba(0,0,0,0.75);
    -moz-box-shadow: -1px 0px 11px -1px rgba(0,0,0,0.75);
    box-shadow: -1px 0px 11px -1px rgba(0,0,0,0.75);
}
.panel {
    bottom: 0px;
    position: fixed;    
    opacity: 1;
    z-index: 1050;
    -webkit-transition: all .6s ease;
    -moz-transition: all .6s ease;
    -o-transition: all .6s ease;
    -ms-transition: all .6s ease;
    transition: all .6s ease;
    width:60px;
    background:#F4F5F7;
}
.panel.out {
    left: 0px;
    bottom:50%;
}
#panel-wrapper-slide .panel-wrapper{
    position: fixed;
    left: -80px;
    transition: 0.3s;
    padding: 15px;
    width: 100px;
    text-decoration: none;
    font-size: 20px;
    color: white;
    border-radius: 0 5px 5px 0;
    background-color: #E1E1E1;
}

#panel-wrapper-slide .panel-wrapper:hover {
    left: 0;
}

`);


function _detect(patterns, selector, action) {        
    let detects = [];
    _.each(patterns, (pattern) => {
        if (selector(pattern)) {
            detects.push(action(pattern, patterns));
        }
    });
    return detects;
}

function _check(patterns) {
    let selector = pattern => {
        let matches = _.filter(pattern, (regex) => { return $(location).attr('href').match(regex); })
        return !_.isEmpty(matches);
    }
    let action = (pattern, patterns) => {
        return (_.invert(patterns))[_.toString(pattern)];
    }
    let detected = _detect(patterns, selector, action);

    return _.isEmpty(detected) ? '' : detected[0];
}

function _app() {    
    return {
        env: _check(CONST.envs),        
        business:  _check(CONST.businesses),  
    };
}

//******************************************************** 
//                 Init Panel And Button
//********************************************************
function createButtons() {    
    let renderedButtons = _.filter(CONST.buttons, {business:'cob'});    
    _.map(renderedButtons, (button, index, buttons) => {          
        if (button.active == false) {return};
        createButton(button);
    });
}

function createButton(button) {        
    let template = templates.buttons[button.template || 'normal'];        
    template.data = button;    
    $('.panel').append(template.html);
    $("#" + button.id).click(button.event);
}

function createPanel(){
    var panel = {
        'display' : 'out',
        'icon' : ''
    }
    let template = templates.panel;
    template.data = panel;
    $('body').after(template.html);
}

function onAccountHolderFillData(e){
    event.preventDefault();
    $.when(blockPage(), fullFillAcountholderTab(), fullFillSigningRightData()).done(function(){
        unblockPage();
    })
}

function onProductFillData(e){
    event.preventDefault();
    blockPage();
    fullfillProductTab();
}



function fullFillAcountholderTab(){    
    var accountHolder = COB_DATA.accountHolder1;
    _fillQuestionnaire(accountHolder);
    _fullfillPersonInformationSubTab(accountHolder);
}

function fullfillProductTab(){
    var product = COB_DATA.product1;
    _fillProductData(product);
}


function fullFillSigningRightData(){
    let tabViewId = CONST.tabs.signingRight;
    let data = COB_DATA.signingRight;

    $(tabViewId + '[id$="regulationType:0"]').attr('checked', 'checked').trigger('change');
    $(tabViewId + '[id$="authorisationType:0"]').attr('checked', 'checked').trigger('change');
}

function blockPage() {
    $.blockuI({ message: '<span class="fa-3x"><i class="fa fa-spinner fa-spin"/></span>'});
}

function unblockPage () {
    $.unblockUI();
}

function _fullfillPersonInformationSubTab(accountHolder) {
    let tabViewId = CONST.tabs.accountHolder;
    let data = accountHolder.personalData;

    $(tabViewId + '[id$="personSalutation_input"]').val($($(tabViewId + '[id$="personSalutation_input"]').find('option')[data.customSalutation]).val()).trigger('change')
    $(tabViewId + '[id$="personFirstName"]').val(chance.first()).trigger('change');
    $(tabViewId + '[id$="personLastName"]').val(chance.last()).trigger('change');
    $(tabViewId + '[id$="personNationality"]').val(data.nationality).trigger('change');
    $(tabViewId + '[id$="homeTown"]').val(data.homeTown).trigger('change');
    $(tabViewId + '[id$="personNationalityItemValue"]').val(data.nationalityItemValue);
    $($(tabViewId + '[id$="personBirthDate_input"]')[0]).val(data.birthDate).trigger('change');
    $(tabViewId + '[id$="personMaritalStatus_input"]').val($($(tabViewId + '[id$="personMaritalStatus_input"]').find('option')[data.customMaritalStatus]).val()).trigger('change')
    $(tabViewId + '[id$="addressStreet"]').val(data.street).trigger('change');
    $(tabViewId + '[id$="addressHouseNo"]').val(data.addressHouseNo).trigger('change');
    $(tabViewId + '[id$="addressZipCode"]').val(data.zipCode).trigger('change');
    $(tabViewId + '[id$="addressCity"]').val(data.city).trigger('change');
    $(tabViewId + '[id$="mobilePhoneI18n"]').val(data.phoneNumber).trigger('change');
    $(tabViewId + '[id$="identificationType_input"]').val($($(tabViewId + '[id$="identificationType_input"]').find('option')[data.identificationType]).val()).trigger('change')
    $(tabViewId + '[id$="accountHolderIdentification:identificationNumber"]').val(data.identificationNumber).trigger('change');
    $(tabViewId + '[id$="accountHolderIdentification:authority"]').val(data.authoriy).trigger('change');
    $(tabViewId + '[id$="accountHolderIdentification:dateOfIssue_input"]').val(data.dateOfIssue).trigger('change');
    $(tabViewId + '[id$="accountHolderIdentification:dateOfExpiry_input"]').val(data.dateOfExp).trigger('change');

    _checkElement('[id$="nokAddressReason_input"]').then((element) => {
        var setSelectedValue = $($(tabViewId + '[id$="nokAddressReason_input"]').find('option')[data.nokReason]).val();        
        $(tabViewId + '[id$="nokAddressReason_input"]').val(setSelectedValue).trigger('change');
    });
}

function _fillQuestionnaire(accountHolder){
    let tabViewId = CONST.tabs.accountHolder;
    let data = accountHolder.questionnaire;

    $(tabViewId + '[id$="isHaveAUsCitizen:0"]').attr('checked', null);
    $(tabViewId + '[id$="isHaveAUsCitizen:1"]').attr('checked', data.isHaveAUsCitizen).trigger('change');

    $(tabViewId + '[id$="isBeneficialOwner:0"]').attr('checked', data.beneficialOwner).trigger('change');
    $(tabViewId + '[id$="isBeneficialOwner:1"]').attr('checked', null);

    $(tabViewId + '[id$="isBornInUS:0"]').attr('checked', null);
    $(tabViewId + '[id$="isBornInUS:1"]').attr('checked', data.isBornInUS).trigger('change');

    $(tabViewId + '[id$="isInPossessionOfUSGreenCard:0"]').attr('checked', null);
    $(tabViewId + '[id$="isInPossessionOfUSGreenCard:1"]').attr('checked', data.isInPossessionOfUSGreenCard).trigger('change');

    $(tabViewId + '[id$="meetTheSubstantialPresenceTest:0"]').attr('checked', null);
    $(tabViewId + '[id$="meetTheSubstantialPresenceTest:1"]').attr('checked', data.meetTheSubstantialPresenceTest).trigger('change');

    $(tabViewId + '[id$="isThereAnyOtherReason:0"]').attr('checked', null);
    $(tabViewId + '[id$="isThereAnyOtherReason:1"]').attr('checked', data.isThereAnyOtherReason).trigger('change');
}

function _fillProductData(product){
    let tabViewId = CONST.tabs.product;
    let data = product.productData;

    $(tabViewId + '[id$="productCategory_input"]').val($($(tabViewId + '[id$="productCategory_input"]').find('option')[data.productCategory]).val()).trigger('change');


    _checkElement('[id$="productType_input"]').then((element) => {
        var setSelectedValue = $($(tabViewId + '[id$="productType_input"]').find('option')[data.productType]).val();
        $(tabViewId + '[id$="productType_input"]').val(setSelectedValue).trigger('change');
        if($(tabViewId + '[id$="productType_input"]').val() === setSelectedValue ){
            unblockPage();
        }
    });
}


function _waiter() {
    return new Promise(resolve => {
        requestAnimationFrame(resolve);
    });
}

async function _checkElement(selector) {
    while (document.querySelector(selector) === null) {
        await _waiter();
    }
    return true;
}