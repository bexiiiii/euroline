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
@Table(name = "cml_prices",
        uniqueConstraints = @UniqueConstraint(name = "uk_price_product_type",
                columnNames = {"product_guid", "price_type_guid"}))
public class CmlPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_guid", nullable = false)
    private String productGuid;

    @Column(name = "price_type_guid", nullable = false)
    private String priceTypeGuid;

    @Column(nullable = false)
    private BigDecimal value;

    @Column(nullable = false)
    private String currency;

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

    public String getPriceTypeGuid() {
        return priceTypeGuid;
    }

    public void setPriceTypeGuid(String priceTypeGuid) {
        this.priceTypeGuid = priceTypeGuid;
    }

    public BigDecimal getValue() {
        return value;
    }

    public void setValue(BigDecimal value) {
        this.value = value;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}
