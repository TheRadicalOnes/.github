trigger R1_TruckTrigger on R1_Truck_Stop__c(before insert) {
  new R1_TriggerHandler().run();
}
