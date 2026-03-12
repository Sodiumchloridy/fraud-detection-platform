package com.workshop.backend.kafka;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    public static final String TOPIC_PENDING = "fraud.transactions.pending";
    public static final String TOPIC_SCORED  = "fraud.transactions.scored";

    @Bean public NewTopic pendingTopic() { return TopicBuilder.name(TOPIC_PENDING).partitions(3).replicas(1).build(); }
    @Bean public NewTopic scoredTopic()  { return TopicBuilder.name(TOPIC_SCORED).partitions(3).replicas(1).build(); }
}
