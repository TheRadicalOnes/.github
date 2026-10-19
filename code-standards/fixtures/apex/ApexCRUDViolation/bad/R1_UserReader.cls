/**
 * @description Fixture.
 */

public with sharing class R1_UserReader {
  public static List<User> currentUser() {
    return [
      SELECT ContactId
      FROM User
      WHERE Id = :UserInfo.getUserId()
      LIMIT 1
    ];
  }
}
