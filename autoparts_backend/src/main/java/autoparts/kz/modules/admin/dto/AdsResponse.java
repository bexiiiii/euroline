package autoparts.kz.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdsResponse {
    private Long id;
    private String title;
    private String description;
    private String imageUrl;
    private boolean active;

}
