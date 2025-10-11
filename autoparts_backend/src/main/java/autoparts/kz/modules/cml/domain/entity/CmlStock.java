package autoparts.kz.modules.cml.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;

@Entity
@Table(name = "cml_stocks",
        uniqueConstraints = @UniqueConstraint(name = "uk_stock_product_warehouse",
                columnNames = {"product_guid", "warehouse_guid"}))
public class CmlStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_guid", nullable = false)
    private String productGuid;

    @Column(name = "warehouse_guid", nullable = false)
    private String warehouseGuid;

    @Column(nullable = false)
    private BigDecimal quantity;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getProductGuid() {
        return productGuid;
    }

    public void setProductGuid(String productGuid) {
        this.productGuid = productGuid;
    }

    public String getWarehouseGuid() {
        return warehouseGuid;
    }

    public void setWarehouseGuid(String warehouseGuid) {
        this.warehouseGuid = warehouseGuid;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }
}
