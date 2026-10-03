package com.alantech.finuni.controllers;

import java.io.IOException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.alantech.finuni.dtos.AIAnswer;
import com.alantech.finuni.dtos.UserInfoContext;
import com.alantech.finuni.services.AssistantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/ai-assistant")
public class AssistantController {
  private final AssistantService assistantService;

  public AssistantController(AssistantService assistantService) {
    this.assistantService = assistantService;
  }

  @PostMapping
  public ResponseEntity<AIAnswer> send(@RequestBody @Valid UserInfoContext userInfoContext)
      throws IOException {
    return ResponseEntity.ok(assistantService.send(userInfoContext));
  }
}
