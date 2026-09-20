package com.sentinelcore.sentinelcore_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SentinelcoreBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(SentinelcoreBackendApplication.class, args);
	}

}
