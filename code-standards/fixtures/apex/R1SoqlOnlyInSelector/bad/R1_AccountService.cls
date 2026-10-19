/**
 * @description Fixture.
 */

public with sharing class R1_AccountService {
  public static List<Account> loadAccounts(Set<Id> accountIds) {
    return [SELECT Id FROM Account WHERE Id IN :accountIds WITH USER_MODE];
  }
}
