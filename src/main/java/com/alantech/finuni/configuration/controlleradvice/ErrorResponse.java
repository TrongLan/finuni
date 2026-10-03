package com.alantech.finuni.configuration.controlleradvice;

import java.time.LocalDateTime;
import java.util.Map;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(int status, String error, String message, Map<String, String> errors,
    LocalDateTime timestamp) {
  public ErrorResponse(int status, String error, String message) {
    this(status, error, message, null, LocalDateTime.now());
  }

  // Constructor cho lỗi Validation
  public ErrorResponse(int status, String error, String message, Map<String, String> errors) {
    this(status, error, message, errors, LocalDateTime.now());
  }
}
