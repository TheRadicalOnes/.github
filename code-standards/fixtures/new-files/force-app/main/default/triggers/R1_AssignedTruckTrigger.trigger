trigger R1_AssignedTruckTrigger on R1_AssignedTruck__c(before insert) {
  new R1_TriggerHandler().run();
}
