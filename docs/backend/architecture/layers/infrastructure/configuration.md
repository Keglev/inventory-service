[⬅️ Back to Infrastructure Index](./index.md)

# Configuration Layer

The **Configuration Layer** manages Spring Boot configuration, application properties, and bean instantiation. It provides environment-specific settings and dependency injection configuration.

## Application Properties

Spring Boot configuration provides environment-specific settings:

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:oracle:thin:@localhost:1521:ORCL
    username: inventory_user
    password: ${DB_PASSWORD}
  
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
  
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
          github:
            client-id: ${GITHUB_CLIENT_ID}
            client-secret: ${GITHUB_CLIENT_SECRET}

app:
  demo:
    readonly: true
```

## Spring Configuration Classes

Java-based configuration for beans and settings:

```java
@Configuration
public class AppConfig {
    
    @Bean
    public SupplierMapper supplierMapper() {
        return new SupplierMapper();
    }
    
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(2);
        executor.initialize();
        return executor;
    }
    
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

## Bean Registration

```java
@Configuration
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
                .requestMatchers("/actuator/health").permitAll()
                .anyRequest().authenticated()
                .and()
            .oauth2Login()
                .successHandler(new OAuth2LoginSuccessHandler())
                .and()
            .logout()
                .permitAll();
        
        return http.build();
    }
}
```

---

[⬅️ Back to Infrastructure Index](./index.md)
