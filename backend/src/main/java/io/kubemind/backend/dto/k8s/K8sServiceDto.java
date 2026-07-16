package io.kubemind.backend.dto.k8s;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class K8sServiceDto {
    private String name;
    private String namespace;
    private String type;
    private String clusterIP;
    private String externalIP;
    private String ports;
    private String creationTimestamp;
}
