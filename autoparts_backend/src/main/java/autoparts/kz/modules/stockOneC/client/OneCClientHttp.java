package autoparts.kz.modules.stockOneC.client;



import autoparts.kz.modules.stockOneC.dto.StockBulkRequest;
import autoparts.kz.modules.stockOneC.dto.StockBulkResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Component
@RequiredArgsConstructor
public class OneCClientHttp implements OneCClient {

    private final RestTemplate restTemplate;

    @Value("${onec.base-url}")
    private String oneCBase;

    @Override
    public StockBulkResponse getStockByOemBulk(List<String> oems) {
        String url = oneCBase + "/bridge/inventory/queryByOem";
        StockBulkRequest req = new StockBulkRequest();
        req.setOems(oems);

        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<StockBulkRequest> entity = new HttpEntity<>(req, h);

        ResponseEntity<StockBulkResponse> resp =
                restTemplate.exchange(url, HttpMethod.POST, entity, StockBulkResponse.class);

        return resp.getBody() == null ? new StockBulkResponse() : resp.getBody();
    }
}

