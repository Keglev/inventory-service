[⬅️ Back to Infrastructure Index](./index.md)

# Security Layer

The **Security Layer** handles OAuth2 authentication, authorization checks, and access control. It manages user authentication from third-party providers and enforces permission rules.

## OAuth2 Authentication

Handles third-party authentication (Google, GitHub, etc.):

```java
@Component
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    
    private final AppUserRepository userRepository;
    
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        OAuth2User oauth2User = super.loadUser(userRequest);
        
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        String oauth2Id = oauth2User.getName();
        
        AppUser user = userRepository.findByEmail(email)
            .orElseGet(() -> createNewUser(email, name, oauth2Id));
        
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        
        return oauth2UserWrapper(user, oauth2User);
    }
    
    private AppUser createNewUser(String email, String name, String oauth2Id) {
        return AppUser.builder()
            .id(UUID.randomUUID().toString())
            .email(email)
            .name(name)
            .oauth2Id(oauth2Id)
            .role(Role.USER)
            .createdAt(LocalDateTime.now())
            .build();
    }
}
```

## Authorization with @PreAuthorize

Method-level authorization checks:

```java
@Service
public class SupplierServiceImpl {
    
    @PreAuthorize("isAuthenticated()")
    public List<SupplierDTO> findAll() {
        return repository.findAll().stream()
            .map(mapper::toDTO)
            .toList();
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    public SupplierDTO create(CreateSupplierDTO dto) {
        return mapper.toDTO(repository.save(mapper.toEntity(dto)));
    }
}
```

## Get Current User

Access authenticated user from SecurityContext:

```java
@Service
public class SupplierServiceImpl {
    
    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder
            .getContext().getAuthentication();
        return auth != null ? auth.getName() : "SYSTEM";
    }
    
    @Transactional
    public SupplierDTO create(CreateSupplierDTO dto) {
        Supplier entity = mapper.toEntity(dto);
        entity.setCreatedBy(getCurrentUsername());
        return mapper.toDTO(repository.save(entity));
    }
}
```

---

[⬅️ Back to Infrastructure Index](./index.md)
