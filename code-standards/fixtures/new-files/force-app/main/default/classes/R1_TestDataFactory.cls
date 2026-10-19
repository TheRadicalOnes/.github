/**
 * @description Fixture.
 */
@IsTest
public class R1_TestDataFactory {
  public static Account createAccount() {
    return new Account(Name = 'Test');
  }
}
