package autoparts.kz.modules.stockOneC.entity;


import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Entity @Table(name="stock", indexes = @Index(name="idx_stock_sku", columnList="sku"))
@Data
public class Stock {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private String sku;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="warehouse_id")
    private Warehouse warehouse;
    @Column(name="available_qty", nullable=false) private int availableQty = 0;
    @Column(name="reserved_qty", nullable=false) private int reservedQty = 0;
    @Column(name="updated_at", nullable=false) private Instant updatedAt = Instant.now();
    @Version private Long version;
}
