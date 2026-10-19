/**
 * @description Fixture.
 */

public with sharing class R1_MetadataReader {
  public static List<R1_TriggerSetting__mdt> activeSettings() {
    return [
      SELECT DeveloperName
      FROM R1_TriggerSetting__mdt
      WHERE R1_IsActive__c = TRUE
    ];
  }
}
