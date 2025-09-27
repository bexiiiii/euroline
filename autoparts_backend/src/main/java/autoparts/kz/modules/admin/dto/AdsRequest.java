package autoparts.kz.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class AdsRequest {
    private long id;
    private String title;
    private String description;
    private String imageUrl;
}
