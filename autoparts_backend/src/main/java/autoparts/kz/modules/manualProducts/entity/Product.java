package autoparts.kz.modules.manualProducts.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

import autoparts.kz.modules.category.entity.Category;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"properties", "category"})
@EqualsAndHashCode(of = "id")
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name; // Название

    @NotBlank
    private String code; // Код детали (OEM или свой)

    private String description; // Описание (опционально)

    @NotBlank
    private String brand; // Бренд (если знаем)

    @NotBlank
    private String externalCode; // Код для 1С

    private String imageUrl; // Картинка (если загружали)


    private Integer price;
    private Integer stock;
    private String sku;

    // Флаг участия в витрине "Товар недели"
    @Column(name = "is_weekly")
    private Boolean isWeekly = false;

    // Период действия weekly (опционально). Если установлены — приоритетны над isWeekly
    @Column(name = "weekly_start_at")
    private java.time.Instant weeklyStartAt;

    @Column(name = "weekly_end_at")
    private java.time.Instant weeklyEndAt;


    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ProductProperty> properties = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;
}
