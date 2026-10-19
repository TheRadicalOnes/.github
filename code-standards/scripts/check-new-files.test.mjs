// Tests for check-new-files.mjs. Run with: node --test code-standards/scripts/check-new-files.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { checkNewFiles } from "./check-new-files.mjs";

const root = fileURLToPath(new URL("../fixtures/new-files/", import.meta.url));
const packageDirs = ["force-app"];
const component = (path) => `force-app/main/default/${path}`;

/**
 * Returns the rules reported for one added file.
 */
const rulesFor = (path) =>
  checkNewFiles({ root, addedFiles: [component(path)], packageDirs }).map(
    (finding) => `${finding.severity}:${finding.rule}`
  );

// [added file, expected "severity:rule" findings]
const cases = [
  ["classes/R1_AccountService.cls", []],
  ["classes/AccountService.cls", ["error:R1ApexClassName"]],
  ["classes/R1_accountHelper.cls", ["error:R1ApexClassName"]],
  ["classes/R1_AccountService_Test.cls", []],
  ["classes/R1_AccountServiceTest.cls", ["error:R1TestClassSuffix"]],
  ["classes/R1_TestDataFactory.cls", []],
  ["classes/R1_Helper_Test.cls", ["error:R1TestClassSuffix"]],
  ["triggers/R1_AssignedTruckTrigger.trigger", []],
  ["triggers/R1_AccountTrigger.trigger", ["error:R1OneTriggerPerObject"]],
  ["triggers/R1_TruckTrigger.trigger", ["error:R1TriggerName"]],
  ["lwc/r1_accountLookup/r1_accountLookup.js-meta.xml", []],
  ["lwc/accountLookup/accountLookup.js-meta.xml", ["error:R1LwcName"]],
  [
    "lwc/r1_accountLookupCmp/r1_accountLookupCmp.js-meta.xml",
    ["error:R1LwcName"]
  ],
  ["aura/R1_AccountSelectedEvt/R1_AccountSelectedEvt.evt", []],
  ["aura/R1_AccountSelected/R1_AccountSelected.evt", ["error:R1AuraName"]],
  ["aura/R1_AccountLookup/R1_AccountLookup.cmp", []],
  ["aura/AccountLookup/AccountLookup.cmp", ["error:R1AuraName"]],
  ["pages/R1_AccountView.page", []],
  ["pages/AccountView.page", ["error:R1VisualforceName"]],
  ["components/R1_AccountCloneCmp.component", []],
  ["components/R1_AccountClone.component", ["error:R1VisualforceName"]],
  ["objects/R1_AssignedTruck__c/R1_AssignedTruck__c.object-meta.xml", []],
  ["objects/R1_TriggerSetting__mdt/R1_TriggerSetting__mdt.object-meta.xml", []],
  [
    "objects/AssignedTruck__c/AssignedTruck__c.object-meta.xml",
    ["error:R1CustomObjectName"]
  ],
  ["objects/OrderApi__Item__c/OrderApi__Item__c.object-meta.xml", []],
  ["objects/Account/Account.object-meta.xml", []],
  ["objects/Account/fields/R1_Priority__c.field-meta.xml", []],
  [
    "objects/Account/fields/Priority__c.field-meta.xml",
    ["error:R1CustomFieldName"]
  ],
  [
    "objects/Account/fields/R1_priority__c.field-meta.xml",
    ["error:R1CustomFieldName"]
  ],
  [
    "objects/OrderApi__Item__c/fields/OrderApi__Display_Name__c.field-meta.xml",
    []
  ],
  ["objects/OrderApi__Item__c/fields/R1_DisplayName__c.field-meta.xml", []],
  [
    "objects/Opportunity/validationRules/R1_CloseDate_NotInPast.validationRule-meta.xml",
    []
  ],
  [
    "objects/Opportunity/validationRules/CloseDate_NotInPast.validationRule-meta.xml",
    ["error:R1ValidationRuleName"]
  ],
  [
    "objects/Opportunity/validationRules/R1_CloseDateNotInPast.validationRule-meta.xml",
    ["error:R1ValidationRuleName"]
  ],
  ["permissionsets/R1_SalesOperations.permissionset-meta.xml", []],
  [
    "permissionsets/SalesOperations.permissionset-meta.xml",
    ["error:R1MetadataPrefix"]
  ],
  ["customPermissions/R1_BypassTriggers.customPermission-meta.xml", []],
  [
    "customPermissions/BypassTriggers.customPermission-meta.xml",
    ["error:R1MetadataPrefix"]
  ],
  ["flows/R1_Record_Trigger_Order_Before_Save.flow-meta.xml", []],
  [
    "flows/Record_Trigger_Order_After_Save.flow-meta.xml",
    ["error:R1FlowName", "warning:R1FlowApiName"]
  ],
  ["flows/R1_Order_Update.flow-meta.xml", ["error:R1FlowLabel"]],
  ["flows/R1_Screen_Flow_Order_Fulfillment.flow-meta.xml", []],
  ["flows/R1_Subflow_Lead_Handler.flow-meta.xml", []],
  ["flows/R1_LeadHandler.flow-meta.xml", ["warning:R1FlowApiName"]]
];

for (const [path, expected] of cases) {
  test(`${path} → ${expected.length ? expected.join(", ") : "no findings"}`, () => {
    assert.deepEqual(rulesFor(path), expected);
  });
}

test("ignores files outside the package directories", () => {
  const findings = checkNewFiles({
    root,
    addedFiles: ["scripts/AccountService.cls"],
    packageDirs
  });

  assert.deepEqual(findings, []);
});

test("skips every check when the project has a namespace", () => {
  const findings = checkNewFiles({
    root,
    addedFiles: [component("classes/AccountService.cls")],
    packageDirs,
    namespace: "acme"
  });

  assert.deepEqual(findings, []);
});
