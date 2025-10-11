package autoparts.kz.modules.stockOneC.kafka;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.*;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.support.converter.StringJsonMessageConverter;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;
import org.springframework.util.backoff.FixedBackOff;

import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableKafka
@ConditionalOnProperty(prefix = "integration.kafka", name = "enabled", havingValue = "true")
public class KafkaProdConfig {

    @Value("${kafka.bootstrap-servers}")
    String bootstrap;

    @Bean
    public Map<String, Object> producerProps() {
        Map<String, Object> p = new HashMap<>();
        p.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrap);
        p.put(ProducerConfig.ACKS_CONFIG, "all");
        p.put(ProducerConfig.RETRIES_CONFIG, 10);
        p.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        p.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5);
        p.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        p.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        p.put(JsonSerializer.ADD_TYPE_INFO_HEADERS, false);
        p.put(ProducerConfig.DELIVERY_TIMEOUT_MS_CONFIG, 120_000);
        p.put(ProducerConfig.REQUEST_TIMEOUT_MS_CONFIG, 30_000);
        return p;
    }

    @Bean
    public ProducerFactory<String, Object> producerFactory() {
        // ВАЖНО: задать дженерики явно <String, Object>
        DefaultKafkaProducerFactory<String, Object> pf =
                new DefaultKafkaProducerFactory<>(producerProps());
        pf.setTransactionIdPrefix("tx-");
        return pf;
    }

    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate() {
        KafkaTemplate<String, Object> kt = new KafkaTemplate<>(producerFactory());
        kt.setMessageConverter(new StringJsonMessageConverter());
        return kt;
    }

    @Bean("stringKafkaTemplate")
    public KafkaTemplate<String, String> stringKafkaTemplate() {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrap);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        props.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, "autoparts-tx-string");
        
        DefaultKafkaProducerFactory<String, String> factory = new DefaultKafkaProducerFactory<>(props);
        return new KafkaTemplate<>(factory);
    }

    @Bean
    public ConsumerFactory<String, Object> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrap);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "autoparts-consumers");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);

        // ЯВНО задаём десериалайзеры подходящих типов
        JsonDeserializer<Object> jsonValue = new JsonDeserializer<>(Object.class);
        jsonValue.addTrustedPackages("*");
        jsonValue.ignoreTypeHeaders();

        return new DefaultKafkaConsumerFactory<>(
                props,
                new StringDeserializer(),
                jsonValue
        );
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, Object> listenerFactory(
            ConsumerFactory<String, Object> cf,
            @Qualifier("kafkaTemplate") KafkaTemplate<String, Object> tpl
    ) {
        ConcurrentKafkaListenerContainerFactory<String, Object> f =
                new ConcurrentKafkaListenerContainerFactory<>();
        f.setConsumerFactory(cf);
        f.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);

        f.setCommonErrorHandler(new DefaultErrorHandler(
                new DeadLetterPublishingRecoverer(tpl),
                new FixedBackOff(1000L, 5)
        ));
        return f;
    }
}
