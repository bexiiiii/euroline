package autoparts.kz.modules.cml.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.retry.MessageRecoverer;
import org.springframework.amqp.rabbit.retry.RejectAndDontRequeueRecoverer;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.amqp.rabbit.config.RetryInterceptorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.backoff.ExponentialBackOffPolicy;

@Configuration
public class RabbitConfig {

    public static final String DLX = "cml.exchange.dlq";

    @Bean
    public TopicExchange cmlExchange(CommerceMlProperties properties) {
        return new TopicExchange(properties.getQueue().getExchange(), true, false);
    }

    @Bean
    public TopicExchange cmlDeadLetterExchange() {
        return new TopicExchange(DLX, true, false);
    }

    @Bean
    public Queue offersImportQueue() {
        return primaryQueue("offers.import.q");
    }

    @Bean
    public Queue offersImportDlq() {
        return dlq("offers.import.q.dlq");
    }

    @Bean
    public Binding offersImportBinding(Queue offersImportQueue, TopicExchange cmlExchange, CommerceMlProperties properties) {
        return BindingBuilder.bind(offersImportQueue)
                .to(cmlExchange)
                .with(properties.getQueue().getOffersRoutingKey());
    }

    @Bean
    public Binding offersImportDlqBinding(Queue offersImportDlq, TopicExchange cmlDeadLetterExchange) {
        return BindingBuilder.bind(offersImportDlq)
                .to(cmlDeadLetterExchange)
                .with(offersImportDlq.getName());
    }

    @Bean
    public Queue catalogImportQueue() {
        return primaryQueue("import.catalog.q");
    }

    @Bean
    public Queue catalogImportDlq() {
        return dlq("import.catalog.q.dlq");
    }

    @Bean
    public Binding catalogImportBinding(Queue catalogImportQueue, TopicExchange cmlExchange, CommerceMlProperties properties) {
        return BindingBuilder.bind(catalogImportQueue)
                .to(cmlExchange)
                .with(properties.getQueue().getCatalogRoutingKey());
    }

    @Bean
    public Binding catalogImportDlqBinding(Queue catalogImportDlq, TopicExchange cmlDeadLetterExchange) {
        return BindingBuilder.bind(catalogImportDlq)
                .to(cmlDeadLetterExchange)
                .with(catalogImportDlq.getName());
    }

    @Bean
    public Queue ordersExportQueue() {
        return primaryQueue("orders.export.q");
    }

    @Bean
    public Queue ordersExportDlq() {
        return dlq("orders.export.q.dlq");
    }

    @Bean
    public Binding ordersExportBinding(Queue ordersExportQueue, TopicExchange cmlExchange, CommerceMlProperties properties) {
        return BindingBuilder.bind(ordersExportQueue)
                .to(cmlExchange)
                .with(properties.getQueue().getOrdersExportRoutingKey());
    }

    @Bean
    public Binding ordersExportDlqBinding(Queue ordersExportDlq, TopicExchange cmlDeadLetterExchange) {
        return BindingBuilder.bind(ordersExportDlq)
                .to(cmlDeadLetterExchange)
                .with(ordersExportDlq.getName());
    }

    @Bean
    public Queue ordersApplyQueue() {
        return primaryQueue("orders.apply.q");
    }

    @Bean
    public Queue ordersApplyDlq() {
        return dlq("orders.apply.q.dlq");
    }

    @Bean
    public Binding ordersApplyBinding(Queue ordersApplyQueue, TopicExchange cmlExchange, CommerceMlProperties properties) {
        return BindingBuilder.bind(ordersApplyQueue)
                .to(cmlExchange)
                .with(properties.getQueue().getOrdersApplyRoutingKey());
    }

    @Bean
    public Binding ordersApplyDlqBinding(Queue ordersApplyDlq, TopicExchange cmlDeadLetterExchange) {
        return BindingBuilder.bind(ordersApplyDlq)
                .to(cmlDeadLetterExchange)
                .with(ordersApplyDlq.getName());
    }

    @Bean
    public Queue ordersIntegrationQueue() {
        return primaryQueue("orders.integration.q");
    }

    @Bean
    public Queue ordersIntegrationDlq() {
        return dlq("orders.integration.q.dlq");
    }

    @Bean
    public Binding ordersIntegrationBinding(Queue ordersIntegrationQueue, TopicExchange cmlExchange, CommerceMlProperties properties) {
        return BindingBuilder.bind(ordersIntegrationQueue)
                .to(cmlExchange)
                .with(properties.getQueue().getOrdersIntegrationRoutingKey());
    }

    @Bean
    public Binding ordersIntegrationDlqBinding(Queue ordersIntegrationDlq, TopicExchange cmlDeadLetterExchange) {
        return BindingBuilder.bind(ordersIntegrationDlq)
                .to(cmlDeadLetterExchange)
                .with(ordersIntegrationDlq.getName());
    }

    @Bean
    public Queue returnsIntegrationQueue() {
        return primaryQueue("returns.integration.q");
    }

    @Bean
    public Queue returnsIntegrationDlq() {
        return dlq("returns.integration.q.dlq");
    }

    @Bean
    public Binding returnsIntegrationBinding(Queue returnsIntegrationQueue, TopicExchange cmlExchange, CommerceMlProperties properties) {
        return BindingBuilder.bind(returnsIntegrationQueue)
                .to(cmlExchange)
                .with(properties.getQueue().getReturnsIntegrationRoutingKey());
    }

    @Bean
    public Binding returnsIntegrationDlqBinding(Queue returnsIntegrationDlq, TopicExchange cmlDeadLetterExchange) {
        return BindingBuilder.bind(returnsIntegrationDlq)
                .to(cmlDeadLetterExchange)
                .with(returnsIntegrationDlq.getName());
    }

    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter messageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter);
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(ConnectionFactory connectionFactory,
                                                                               MessageConverter messageConverter,
                                                                               MessageRecoverer messageRecoverer) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(messageConverter);
        factory.setAdviceChain(RetryInterceptorBuilder.stateless()
                .maxAttempts(3)
                .backOffPolicy(exponentialBackOff())
                .recoverer(messageRecoverer)
                .build());
        factory.setDefaultRequeueRejected(false);
        return factory;
    }

    @Bean
    public MessageRecoverer messageRecoverer() {
        return new RejectAndDontRequeueRecoverer();
    }

    private Queue primaryQueue(String name) {
        return QueueBuilder.durable(name)
                .withArgument("x-dead-letter-exchange", DLX)
                .withArgument("x-dead-letter-routing-key", name + ".dlq")
                .build();
    }

    private Queue dlq(String name) {
        return QueueBuilder.durable(name).build();
    }

    private ExponentialBackOffPolicy exponentialBackOff() {
        ExponentialBackOffPolicy policy = new ExponentialBackOffPolicy();
        policy.setInitialInterval(5_000);
        policy.setMultiplier(6.0);
        policy.setMaxInterval(120_000);
        return policy;
    }
}
