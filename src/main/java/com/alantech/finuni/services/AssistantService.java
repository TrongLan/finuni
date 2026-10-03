package com.alantech.finuni.services;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.stringtemplate.v4.ST;
import com.alantech.finuni.dtos.AIAnswer;
import com.alantech.finuni.dtos.UserInfoContext;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;


@Service
public class AssistantService {
  private final ChatClient chatClient;
  private final ObjectMapper objectMapper;

  @Value("classpath:/templates/user-prompt.st")
  private Resource userInfo;

  public AssistantService(ChatClient chatClient, ObjectMapper objectMapper) {
    this.chatClient = chatClient;
    this.objectMapper = objectMapper;
  }

  public AIAnswer send(UserInfoContext context) throws IOException {
    Map<String, Object> params =
        objectMapper.convertValue(context, new TypeReference<Map<String, Object>>() {});

    String templateContent = userInfo.getContentAsString(StandardCharsets.UTF_8);
    ST st = new ST(templateContent, '<', '>');

    params.forEach((key, value) -> {
      if (value != null) {
        st.add(key, value);
      }
    });

    return chatClient.prompt().user(st.render())
        .advisors(advisor -> advisor.param(ChatMemory.CONVERSATION_ID, context.getSessionId()))
        .call().entity(AIAnswer.class);
  }

}
