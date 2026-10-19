/**
 * @description Fixture.
 */

public with sharing class R1_ThrowDirectController {
  @AuraEnabled
  public static void save(String message) {
    throw new AuraHandledException(message);
  }
}
