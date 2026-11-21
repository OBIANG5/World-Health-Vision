package com.worldhealthvision.research;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Private research storage. Deliberately separate from public statistical
 * catalogues. No market data or brokerage execution is exposed here.
 */
@SpringBootApplication
public class ResearchWorkspaceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ResearchWorkspaceApplication.class, args);
    }
}
