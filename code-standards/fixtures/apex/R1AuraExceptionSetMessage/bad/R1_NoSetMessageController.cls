/**
 * @description Fixture.
 */

public with sharing class R1_NoSetMessageController {
  @AuraEnabled
  public static void save(String message) {
    AuraHandledException auraException = new AuraHandledException(message);
    throw auraException;
  }
}
