/**
 * @description Fixture.
 */
public with sharing class R1_ComplexityEight {
  public Integer count(Integer value) {
    Integer result = 0;
    if (value == 0) {
      result++;
    }
    if (value == 1) {
      result++;
    }
    if (value == 2) {
      result++;
    }
    if (value == 3) {
      result++;
    }
    if (value == 4) {
      result++;
    }
    if (value == 5) {
      result++;
    }
    if (value == 6) {
      result++;
    }
    return result;
  }
}
