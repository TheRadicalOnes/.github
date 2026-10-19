/**
 * @description Fixture.
 */

@IsTest
private class R1_NoAssert_Test {
  @IsTest
  static void shouldRun_WhenCalled() {
    Integer result = 1 + 1;
    System.debug(LoggingLevel.INFO, result);
  }
}
