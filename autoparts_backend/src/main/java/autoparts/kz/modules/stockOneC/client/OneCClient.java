package autoparts.kz.modules.stockOneC.client;

import autoparts.kz.modules.stockOneC.dto.StockBulkResponse;

import java.util.List;

public interface OneCClient {
    /** Батч по массиву OEM */
    StockBulkResponse getStockByOemBulk(List<String> oems);
}
