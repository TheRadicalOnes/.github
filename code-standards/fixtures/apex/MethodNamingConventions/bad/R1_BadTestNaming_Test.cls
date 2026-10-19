/**
 * @description Fixture.
 */
@IsTest
private class R1_BadTestNaming_Test {
  @IsTest
  static void testAddNumbers() {
    Assert.areEqual(2, 1 + 1, 'Sum should be 2');
  }
}
