package io.kubemind.backend.dto.k8s;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class K8sPodDto {
    private String name;
    private String namespace;
    private String status;
    private String podIP;
    private String hostIP;
    private String nodeName;
    private int restartCount;
    private String creationTimestamp;
    private String containers;
}
