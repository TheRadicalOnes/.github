/**
 * @description Fixture.
 */

@IsTest
private class R1_AssertClass_Test {
  @IsTest
  static void shouldAddNumbers_WhenBothArePositive() {
    Assert.areEqual(2, 1 + 1, 'Sum should be 2');
  }
}
