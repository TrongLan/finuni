package com.alantech.finuni.dtos;

import jakarta.validation.constraints.NotBlank;

public class UserInfoContext {
  @NotBlank(message = "Session ID is required.")
  private String sessionId;
  @NotBlank(message = "You must provide your nationality.")
  private String countryName;
  @NotBlank(message = "You must provide the host country.")
  private String hostCountryName;
  @NotBlank(message = "You must provide the city of the host country.")
  private String hostCityName;
  @NotBlank(message = "Please provide your monthly income.")
  private String monthlyIncome;
  private String moreInfo;
  private String userPrompt;
  private String currentSpreadSheet;
  private String fixedCost;
  private String financialGoal;
  private String spreadSheetTemplate;
  private boolean reviewOnly;


  public String getSessionId() {
    return sessionId;
  }

  public void setSessionId(String sessionId) {
    this.sessionId = sessionId;
  }

  public String getCountryName() {
    return countryName;
  }

  public void setCountryName(String countryName) {
    this.countryName = countryName;
  }

  public String getHostCountryName() {
    return hostCountryName;
  }

  public void setHostCountryName(String hostCountryName) {
    this.hostCountryName = hostCountryName;
  }

  public String getHostCityName() {
    return hostCityName;
  }

  public void setHostCityName(String hostCityName) {
    this.hostCityName = hostCityName;
  }

  public String getMonthlyIncome() {
    return monthlyIncome;
  }

  public void setMonthlyIncome(String monthlyIncome) {
    this.monthlyIncome = monthlyIncome;
  }

  public String getMoreInfo() {
    return moreInfo;
  }

  public void setMoreInfo(String moreInfo) {
    this.moreInfo = moreInfo;
  }

  public String getUserPrompt() {
    return userPrompt;
  }

  public void setUserPrompt(String userPrompt) {
    this.userPrompt = userPrompt;
  }

  public String getCurrentSpreadSheet() {
    return currentSpreadSheet;
  }

  public void setCurrentSpreadSheet(String currentSpreadSheet) {
    this.currentSpreadSheet = currentSpreadSheet;
  }

  public String getSpreadSheetTemplate() {
    return spreadSheetTemplate;
  }

  public void setSpreadSheetTemplate(String spreadSheetTemplate) {
    this.spreadSheetTemplate = spreadSheetTemplate;
  }

  public String getFixedCost() {
    return fixedCost;
  }

  public void setFixedCost(String fixedCost) {
    this.fixedCost = fixedCost;
  }

  public String getFinancialGoal() {
    return financialGoal;
  }

  public void setFinancialGoal(String financialGoal) {
    this.financialGoal = financialGoal;
  }

  public boolean isReviewOnly() {
    return reviewOnly;
  }

  public void setReviewOnly(boolean reviewOnly) {
    this.reviewOnly = reviewOnly;
  }

}
