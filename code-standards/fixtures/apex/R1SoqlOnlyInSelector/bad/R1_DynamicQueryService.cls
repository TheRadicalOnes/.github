/**
 * @description Fixture.
 */

public with sharing class R1_DynamicQueryService {
  public static List<SObject> load(String accountName) {
    return Database.queryWithBinds(
      'SELECT Id FROM Account WHERE Name = :accountName',
      new Map<String, Object>{ 'accountName' => accountName },
      AccessLevel.USER_MODE
    );
  }
}
