/**
 * @description Fixture.
 */

public with sharing class R1_ContactTriggerHandler extends R1_TriggerHandler {
  protected override void beforeInsert() {
    System.debug(LoggingLevel.INFO, 'beforeInsert');
  }
}
