package io.kubemind.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class KubeMindApplication {

    public static void main(String[] args) {
        SpringApplication.run(KubeMindApplication.class, args);
    }
}
