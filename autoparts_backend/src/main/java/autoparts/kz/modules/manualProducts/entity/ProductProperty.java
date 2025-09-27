package autoparts.kz.modules.manualProducts.entity;

import jakarta.persistence.*;
import lombok.*;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@ToString
@Entity
@Table(name = "product_properties")
public class ProductProperty {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String propertyName;
    private String propertyValue;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;
}


