/**
 * @description Fixture.
 */

public with sharing class R1_SetMessageController {
  @AuraEnabled
  public static void save(String message) {
    AuraHandledException auraException = new AuraHandledException(message);
    auraException.setMessage(message);
    throw auraException;
  }
}
