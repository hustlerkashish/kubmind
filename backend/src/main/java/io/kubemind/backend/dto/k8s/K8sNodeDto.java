package io.kubemind.backend.dto.k8s;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class K8sNodeDto {
    private String name;
    private String status;
    private String role;
    private String kubeletVersion;
    private String internalIP;
    private String cpuCapacity;
    private String memoryCapacity;
    private String creationTimestamp;
}
