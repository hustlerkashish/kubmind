package io.kubemind.backend.config;

import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.util.ClientBuilder;
import io.kubernetes.client.util.KubeConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileReader;
import java.io.File;

@Configuration
@Slf4j
public class KubernetesClientConfig {

    @Bean
    public ApiClient kubernetesApiClient() {
        log.info("Initializing Official Kubernetes Java Client Configuration...");

        try {
            // Priority 1: Check $KUBECONFIG or default ~/.kube/config file
            String kubeconfigPath = System.getenv("KUBECONFIG");
            if (kubeconfigPath == null || kubeconfigPath.isEmpty()) {
                String userHome = System.getProperty("user.home");
                kubeconfigPath = userHome + File.separator + ".kube" + File.separator + "config";
            }

            File kubeconfigFile = new File(kubeconfigPath);
            if (kubeconfigFile.exists()) {
                log.info("Loading Kubernetes configuration from kubeconfig file: {}", kubeconfigFile.getAbsolutePath());
                KubeConfig kubeConfig = KubeConfig.loadKubeConfig(new FileReader(kubeconfigFile));
                ApiClient client = ClientBuilder.kubeconfig(kubeConfig).build();
                io.kubernetes.client.openapi.Configuration.setDefaultApiClient(client);
                return client;
            }

            // Priority 2: In-Cluster Configuration (Pod Service Account)
            log.info("Kubeconfig file not found. Attempting In-Cluster Service Account client discovery...");
            ApiClient inClusterClient = ClientBuilder.standard().build();
            io.kubernetes.client.openapi.Configuration.setDefaultApiClient(inClusterClient);
            return inClusterClient;

        } catch (Exception ex) {
            log.warn("Unable to establish active Kubernetes cluster connection ({}), enabling fallback discovery mode.", ex.getMessage());
            ApiClient fallbackClient = new ApiClient();
            fallbackClient.setBasePath("http://localhost:8080");
            return fallbackClient;
        }
    }
}
