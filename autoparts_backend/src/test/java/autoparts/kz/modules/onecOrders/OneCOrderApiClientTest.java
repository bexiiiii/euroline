package autoparts.kz.modules.onecOrders;

import org.junit.jupiter.api.Test;
import org.springframework.http.*;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class OneCOrderApiClientTest {
    @Test void recoversExistingOrderWithoutPostingEvenIfOneCCommandDeduplicationIsBroken() {
        var rest = new RestTemplate(); var server = MockRestServiceServer.bindTo(rest).build();
        var config = new OneCOrderProperties(); config.setUrl("https://onec.test/orders");
        config.setUsername("test"); config.setPassword("test"); config.setOdataUrl("https://onec.test/odata");
        String ref = "e14a5fbd-cba2-4e0c-888c-8a4176be3f3e";
        String currency = "40043052-5f34-11f1-9248-7c214aee94f8";config.setCurrencyRefKey(currency);
        server.expect(method(HttpMethod.GET)).andRespond(withSuccess("{\"value\":[{\"Ref_Key\":\""+ref+"\",\"Комментарий\":\"Website order #U0HT3\\nDelivery\",\"DeletionMark\":false}]}",MediaType.APPLICATION_JSON));
        server.expect(method(HttpMethod.GET)).andRespond(withSuccess("{\"Ref_Key\":\""+ref+"\",\"СуммаДокумента\":24000,\"Валюта_Key\":\""+currency+"\",\"Товары\":[{\"Номенклатура_Key\":\"product-1\",\"Количество\":6,\"Цена\":4000}]}",MediaType.APPLICATION_JSON));
        assertThat(new OneCOrderApiClient(config,rest).recoverOrSend("{\"data\":{\"siteOrderNumber\":\"U0HT3\",\"items\":[{\"productRefKey\":\"product-1\",\"quantity\":6,\"price\":4000}]}}",null,false)).isEqualTo(ref);
        server.verify();
    }

    @Test void uncertainAttemptDoesNotCreateAnotherOrderWhenLookupHasNoResult() {
        var rest = new RestTemplate(); var server = MockRestServiceServer.bindTo(rest).build();
        var config = new OneCOrderProperties();config.setUsername("test");config.setPassword("test");
        config.setOdataUrl("https://onec.test/odata");
        server.expect(method(HttpMethod.GET)).andRespond(withSuccess("{\"value\":[]}",MediaType.APPLICATION_JSON));
        assertThatThrownBy(() -> new OneCOrderApiClient(config,rest).recoverOrSend("{\"data\":{\"siteOrderNumber\":\"U0HT3\"}}",null,false))
                .isInstanceOf(OneCOrderApiClient.UncertainDeliveryException.class);
        server.verify();
    }

    @Test void acceptsOnlyAnExplicitProcessedAcknowledgmentWithDocumentKey() {
        var rest = new RestTemplate(); var server = MockRestServiceServer.bindTo(rest).build();
        var config = new OneCOrderProperties(); config.setUrl("https://onec.test/orders");
        config.setUsername("test"); config.setPassword("test"); config.setToken("test-token");
        var client = new OneCOrderApiClient(config, rest);
        String ref = "e14a5fbd-cba2-4e0c-888c-8a4176be3f3e";
        server.expect(requestTo(config.getUrl())).andExpect(method(HttpMethod.POST))
                .andExpect(header("X-SiteIntegration-Token", "test-token"))
                .andExpect(content().string("{\"commandId\":\"stable\"}"))
                .andRespond(withSuccess("{\"success\":true,\"status\":\"processed\",\"oneCRefKey\":\""+ref+"\"}", MediaType.APPLICATION_JSON));
        assertThat(client.send("{\"commandId\":\"stable\"}")).isEqualTo(ref); server.verify();
    }

    @Test void successfulHttpWithoutValidAcknowledgmentIsNotDelivery() {
        for (String body : new String[]{"{}", "{\"success\":false}", "{\"success\":true,\"status\":\"processed\"}"}) {
            var rest = new RestTemplate(); var server = MockRestServiceServer.bindTo(rest).build();
            var config = new OneCOrderProperties(); config.setUrl("https://onec.test/orders");
            config.setUsername("test"); config.setPassword("test");
            server.expect(requestTo(config.getUrl())).andRespond(withSuccess(body, MediaType.APPLICATION_JSON));
            assertThatThrownBy(() -> new OneCOrderApiClient(config, rest).send("{}")).isInstanceOf(RuntimeException.class);
            server.verify();
        }
    }

    @Test void retriesTransientFailuresButNotConfigurationOrValidationErrors() {
        assertThat(OneCOrderDispatcher.retryable(new ResourceAccessException("timeout"))).isTrue();
        assertThat(OneCOrderDispatcher.retryable(new HttpServerErrorException(HttpStatus.SERVICE_UNAVAILABLE))).isTrue();
        assertThat(OneCOrderDispatcher.retryable(new HttpClientErrorException(HttpStatus.TOO_MANY_REQUESTS))).isTrue();
        for (var status : new HttpStatus[]{HttpStatus.BAD_REQUEST,HttpStatus.UNAUTHORIZED,HttpStatus.FORBIDDEN,HttpStatus.UNPROCESSABLE_ENTITY}) {
            assertThat(OneCOrderDispatcher.retryable(new HttpClientErrorException(status))).isFalse();
        }
    }

    @Test void refusesInsecureTransportAndMissingCredentials() {
        var config = new OneCOrderProperties(); config.setUrl("http://onec.test/orders");
        assertThatThrownBy(() -> new OneCOrderApiClient(config)).hasMessageContaining("HTTPS");
        config.setUrl("https://onec.test/orders");
        assertThatThrownBy(() -> new OneCOrderApiClient(config)).hasMessageContaining("credentials");
    }

    @Test void completesOnlyEmptyDraftTotalAndCurrencyThenVerifiesPersistence() {
        var rest = new RestTemplate(); var server = MockRestServiceServer.bindTo(rest).build();
        var config = new OneCOrderProperties(); config.setUrl("https://onec.test/orders");
        config.setUsername("test"); config.setPassword("test"); config.setOdataUrl("https://onec.test/odata");
        String ref = "e14a5fbd-cba2-4e0c-888c-8a4176be3f3e";
        String currency = "40043052-5f34-11f1-9248-7c214aee94f8"; config.setCurrencyRefKey(currency);
        String rows = "\"Товары\":[{\"Номенклатура_Key\":\"product-1\",\"Количество\":6,\"Цена\":4000,\"Сумма\":24000,\"СуммаНДС\":0,\"СуммаСНДС\":0}]";
        String document = "{\"Ref_Key\":\""+ref+"\",\"Posted\":false,\"СуммаДокумента\":0,\"Валюта_Key\":\"00000000-0000-0000-0000-000000000000\","+rows+"}";
        server.expect(method(HttpMethod.GET)).andRespond(withSuccess("{\"value\":[]}", MediaType.APPLICATION_JSON));
        server.expect(requestTo(config.getUrl())).andRespond(withSuccess("{\"success\":true,\"status\":\"processed\",\"oneCRefKey\":\""+ref+"\"}",MediaType.APPLICATION_JSON));
        server.expect(method(HttpMethod.GET)).andRespond(withSuccess(document,MediaType.APPLICATION_JSON));
        server.expect(method(HttpMethod.PATCH)).andExpect(content().json("{\"СуммаДокумента\":24000,\"Валюта_Key\":\""+currency+"\",\"Товары\":[{\"Номенклатура_Key\":\"product-1\",\"Количество\":6,\"Цена\":4000,\"Сумма\":24000,\"СуммаНДС\":0,\"СуммаСНДС\":24000}]}"))
                .andRespond(withNoContent());
        server.expect(method(HttpMethod.GET)).andRespond(withSuccess(document.replace("\"СуммаДокумента\":0","\"СуммаДокумента\":24000").replace("00000000-0000-0000-0000-000000000000",currency),MediaType.APPLICATION_JSON));
        assertThat(new OneCOrderApiClient(config,rest).send("{\"data\":{\"siteOrderNumber\":\"U0HT3\",\"items\":[{\"productRefKey\":\"product-1\",\"quantity\":6,\"price\":4000}]}}"))
                .isEqualTo(ref);
        server.verify();
    }

    @Test void doesNotChangeDocumentWhoseItemsHaveBeenEditedInOneC() {
        var rest = new RestTemplate(); var server = MockRestServiceServer.bindTo(rest).build();
        var config = new OneCOrderProperties(); config.setUrl("https://onec.test/orders");
        config.setUsername("test"); config.setPassword("test"); config.setOdataUrl("https://onec.test/odata");
        String ref = "e14a5fbd-cba2-4e0c-888c-8a4176be3f3e";
        server.expect(method(HttpMethod.GET)).andRespond(withSuccess("{\"value\":[]}", MediaType.APPLICATION_JSON));
        server.expect(method(HttpMethod.POST)).andRespond(withSuccess("{\"success\":true,\"status\":\"processed\",\"oneCRefKey\":\""+ref+"\"}",MediaType.APPLICATION_JSON));
        server.expect(method(HttpMethod.GET)).andRespond(withSuccess("{\"Ref_Key\":\""+ref+"\",\"Товары\":[{\"Номенклатура_Key\":\"product-1\",\"Количество\":7,\"Цена\":4000}]}",MediaType.APPLICATION_JSON));
        assertThatThrownBy(() -> new OneCOrderApiClient(config,rest).send("{\"data\":{\"siteOrderNumber\":\"U0HT3\",\"items\":[{\"productRefKey\":\"product-1\",\"quantity\":6,\"price\":4000}]}}"))
                .hasMessageContaining("items differ");
        server.verify();
    }
}
