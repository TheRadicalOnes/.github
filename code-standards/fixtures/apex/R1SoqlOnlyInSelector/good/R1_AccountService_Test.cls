/**
 * @description Fixture.
 */

@IsTest
private class R1_AccountService_Test {
  @IsTest
  static void shouldFindAccounts_WhenTheyExist() {
    List<Account> accounts = [SELECT Id FROM Account];
    Assert.areEqual(0, accounts.size(), 'No accounts expected');
  }
}
