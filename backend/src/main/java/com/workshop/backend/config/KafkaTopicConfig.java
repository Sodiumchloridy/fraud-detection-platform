package com.workshop.backend.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic pendingShapTopic() {
        return TopicBuilder.name("transactions.pending-shap")
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic shapCompletedTopic() {
        return TopicBuilder.name("transactions.shap-completed")
                .partitions(1)
                .replicas(1)
                .build();
    }
}
