package io.kubemind.backend.dto.k8s;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class K8sClusterDto {
    private String clusterName;
    private String serverUrl;
    private String currentContext;
    private String kubernetesVersion;
    private String status;
    private boolean connected;
    private int totalNodes;
    private int totalPods;
}
