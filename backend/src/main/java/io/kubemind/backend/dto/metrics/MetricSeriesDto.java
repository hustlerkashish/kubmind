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
public class MetricSeriesDto {
    private String metricName;
    private String target; // e.g. pod name, node name, interface
    private String unit;
    private List<MetricDatapointDto> datapoints;
}
