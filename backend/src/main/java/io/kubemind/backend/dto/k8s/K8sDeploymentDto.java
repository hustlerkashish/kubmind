package io.kubemind.backend.dto.k8s;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class K8sDeploymentDto {
    private String name;
    private String namespace;
    private int desiredReplicas;
    private int availableReplicas;
    private int updatedReplicas;
    private String status;
    private String image;
    private String creationTimestamp;
}
