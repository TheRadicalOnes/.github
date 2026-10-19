/**
 * @description Fixture.
 */

@IsTest
private class R1_SystemAssert_Test {
  @IsTest
  static void shouldAddNumbers_WhenBothArePositive() {
    System.assertEquals(2, 1 + 1, 'Sum should be 2');
  }
}
