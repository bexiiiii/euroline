package autoparts.kz.modules.stockOneC.dto;



import lombok.Data;
import java.util.List;

@Data
public class StockBulkRequest {
    private List<String> oems;
}
