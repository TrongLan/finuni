package com.alantech.finuni.configuration;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.memory.repository.jdbc.JdbcChatMemoryRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import com.fasterxml.jackson.databind.ObjectMapper;

@Configuration
public class AIConfiguration {
  private final JdbcChatMemoryRepository chatMemoryRepository;

  @Value("classpath:/templates/system-context.st")
  private Resource systemContext;

  public AIConfiguration(JdbcChatMemoryRepository chatMemoryRepository) {
    this.chatMemoryRepository = chatMemoryRepository;
  }

  @Bean
  ChatClient chatClient(ChatClient.Builder builder, ChatMemory chatMemory) {
    return builder.defaultSystem(systemContext)
        .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build()).build();
  }

  @Bean
  ChatMemory chatMemory() {
    return MessageWindowChatMemory.builder().chatMemoryRepository(chatMemoryRepository)
        .maxMessages(50).build();
  }
  
  @Bean
  ObjectMapper objectMapper() {
      return new ObjectMapper();
  }
}
