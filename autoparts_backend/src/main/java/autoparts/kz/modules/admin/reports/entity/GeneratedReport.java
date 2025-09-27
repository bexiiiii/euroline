package autoparts.kz.modules.admin.reports.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name="generated_reports") @Getter
@Setter
public class GeneratedReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String type; // SALES/PRODUCTS/FINANCE...
    private String format; // CSV/XLSX
    private String path;   // file path
    private Instant createdAt; @PrePersist void t(){ createdAt = Instant.now(); }
}