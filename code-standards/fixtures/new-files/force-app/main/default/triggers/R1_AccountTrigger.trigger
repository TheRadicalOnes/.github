trigger R1_AccountTrigger on Account(before insert) {
  new R1_TriggerHandler().run();
}
