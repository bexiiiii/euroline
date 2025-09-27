package autoparts.kz.modules.stockOneC.entity;


import jakarta.persistence.*;
import lombok.Data;

@Entity @Table(name="warehouse")
@Data
public class Warehouse {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false, unique=true) private String code;
    private String name;
    private String address;
}