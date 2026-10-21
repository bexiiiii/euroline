package autoparts.kz.modules.cart.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;

import autoparts.kz.modules.manualProducts.entity.Product;

import java.math.BigDecimal;


@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JsonIgnore
    private Cart cart;

    @ManyToOne
    private Product product;

    private int quantity;
    private BigDecimal price;

    @Column(name = "warehouse_name", length = 255)
    private String warehouseName;

    @Column(name = "warehouse_ref_key", length = 64)
    private String warehouseRefKey;

}
