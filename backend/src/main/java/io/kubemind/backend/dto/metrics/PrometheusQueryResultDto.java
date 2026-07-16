package io.kubemind.backend.dto.metrics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PrometheusQueryResultDto {
    private String queryType; // CPU, Memory, Network, Disk, Pod, Node
    private String range;     // 5m, 1h, 6h, 24h, 7d
    private boolean livePrometheusConnected;
    private List<MetricSeriesDto> series;
}
