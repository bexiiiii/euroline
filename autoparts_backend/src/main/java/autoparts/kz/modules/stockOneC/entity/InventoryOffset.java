package autoparts.kz.modules.stockOneC.entity;


import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name="inventory_offset", uniqueConstraints=@UniqueConstraint(columnNames={"sku","warehouse_code"}))
@Data
public class InventoryOffset {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private String sku;
    @Column(name="warehouse_code", nullable=false) private String warehouseCode;
    @Column(nullable=false) private Long lastSequence;
}