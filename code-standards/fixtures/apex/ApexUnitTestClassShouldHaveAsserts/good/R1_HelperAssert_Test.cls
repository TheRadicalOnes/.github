/**
 * @description Fixture.
 */

@IsTest
private class R1_HelperAssert_Test {
  @IsTest
  static void shouldAddNumbers_WhenBothArePositive() {
    assertSum(2, 1 + 1);
  }

  private static void assertSum(Integer expected, Integer actual) {
    Assert.areEqual(expected, actual, 'Unexpected sum');
  }
}
