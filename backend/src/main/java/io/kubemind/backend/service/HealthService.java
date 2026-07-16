package io.kubemind.backend.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class HealthService {

    public Map<String, Object> getHealthDetails() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "KubeMind Core Backend");
        health.put("database", "PostgreSQL Connected");
        health.put("javaVersion", System.getProperty("java.version"));
        health.put("activeProfile", System.getProperty("spring.profiles.active", "dev"));
        return health;
    }
}
