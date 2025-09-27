package autoparts.kz.modules.admin.api.entity;

import jakarta.persistence.*;

@Entity
@Table(name="api_endpoint_meta")
@lombok.Getter @lombok.Setter
public class ApiEndpointMeta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String path;      // например /api/orders
    private String method;    // GET/POST/...
    private String summary;   // человеко-читаемое описание
    private boolean enabled = true;
}
