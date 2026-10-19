/**
 * @description Fixture.
 */

public with sharing class R1_AccountSelector {
  public static List<Account> selectByIds(Set<Id> accountIds) {
    return [SELECT Id FROM Account WHERE Id IN :accountIds WITH USER_MODE];
  }
}
