package autoparts.kz.modules.onecEvents.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Склады 1С для фильтров на витрине. Справочник приходит событием warehouse.updated;
 * склады, которые пока известны только по остаткам или заказам, тоже попадают в список,
 * чтобы фильтр не терял их до прихода названия.
 */
@RestController
public class OneCWarehouseController {

    public record WarehouseDto(String refKey, String name, String code) {
    }

    private final JdbcTemplate jdbcTemplate;

    public OneCWarehouseController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/api/warehouses")
    public List<WarehouseDto> warehouses() {
        return jdbcTemplate.query(
                "SELECT k.ref_key, COALESCE(w.name, (" +
                        "  SELECT s.warehouse_name FROM onec_stocks s " +
                        "  WHERE s.warehouse_ref_key = k.ref_key AND s.warehouse_name IS NOT NULL " +
                        "  ORDER BY s.updated_at DESC LIMIT 1" +
                        ")), w.code FROM (" +
                        "  SELECT ref_key FROM onec_warehouses WHERE NOT deletion_mark" +
                        "  UNION SELECT warehouse_ref_key FROM onec_stocks" +
                        "  UNION SELECT onec_warehouse_ref_key FROM orders WHERE onec_warehouse_ref_key IS NOT NULL" +
                        ") k LEFT JOIN onec_warehouses w ON w.ref_key = k.ref_key " +
                        "WHERE w.ref_key IS NULL OR NOT w.deletion_mark " +
                        "ORDER BY 2 NULLS LAST, k.ref_key",
                (rs, i) -> new WarehouseDto(rs.getString(1), rs.getString(2), rs.getString(3))
        );
    }
}
