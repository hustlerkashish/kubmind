package io.kubemind.backend.dto.k8s;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class K8sEventDto {
    private String id;
    private String type; // Normal, Warning
    private String reason;
    private String message;
    private String involvedObject;
    private String namespace;
    private String count;
    private String lastTimestamp;
}
