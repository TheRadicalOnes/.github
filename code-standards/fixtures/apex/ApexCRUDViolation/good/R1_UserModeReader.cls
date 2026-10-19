/**
 * @description Fixture.
 */

public with sharing class R1_UserModeReader {
  public static List<User> currentUser() {
    return [
      SELECT ContactId
      FROM User
      WHERE Id = :UserInfo.getUserId()
      WITH USER_MODE
      LIMIT 1
    ];
  }
}
