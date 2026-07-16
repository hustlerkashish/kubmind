package io.kubemind.backend.dto.metrics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GrafanaEmbedDto {
    private String title;
    private String panelId;
    private String dashboardUid;
    private String embedUrl;
    private String description;
}
