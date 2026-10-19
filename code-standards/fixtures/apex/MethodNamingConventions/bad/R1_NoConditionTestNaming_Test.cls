/**
 * @description Fixture.
 */
@IsTest
private class R1_NoConditionTestNaming_Test {
  @IsTest
  static void shouldAddNumbers() {
    Assert.areEqual(2, 1 + 1, 'Sum should be 2');
  }
}
