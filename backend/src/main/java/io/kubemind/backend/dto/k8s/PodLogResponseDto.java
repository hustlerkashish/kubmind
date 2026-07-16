package io.kubemind.backend.dto.k8s;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PodLogResponseDto {
    private String podName;
    private String namespace;
    private String containerName;
    private int tailLines;
    private List<String> logs;
}
