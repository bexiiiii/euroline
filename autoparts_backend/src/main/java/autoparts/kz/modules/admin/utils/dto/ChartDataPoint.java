package autoparts.kz.modules.admin.utils.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ChartDataPoint {
    private String date;
    private double value;
}
