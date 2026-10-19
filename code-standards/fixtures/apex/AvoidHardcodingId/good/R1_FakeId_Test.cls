/**
 * @description Fixture.
 */

@IsTest
private class R1_FakeId_Test {
  @IsTest
  static void shouldBuildFakeId_WhenPrefixIsKnown() {
    Id fakeId =
      Account.SObjectType.getDescribe().getKeyPrefix() + '000000000000AAA';
    Assert.isNotNull(fakeId, 'Fake Id should be built');
  }
}
