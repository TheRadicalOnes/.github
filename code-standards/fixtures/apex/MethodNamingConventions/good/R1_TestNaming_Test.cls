/**
 * @description Fixture.
 */
@IsTest
private class R1_TestNaming_Test {
  @IsTest
  static void shouldAddNumbers_WhenBothArePositive() {
    Assert.areEqual(2, 1 + 1, 'Sum should be 2');
  }

  @IsTest
  static void shouldAddNumbersWhenBothArePositive() {
    Assert.areEqual(2, 1 + 1, 'Sum should be 2');
  }
}
