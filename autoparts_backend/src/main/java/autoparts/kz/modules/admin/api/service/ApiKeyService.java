package autoparts.kz.modules.admin.api.service;


import autoparts.kz.modules.admin.api.entity.ApiKey;
import autoparts.kz.modules.admin.api.repository.ApiKeyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApiKeyService {
    private final ApiKeyRepository repo;
    private final org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder bCrypt = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();

    public Map<String,String> create(String name){
        String raw = UUID.randomUUID().toString().replace("-", "");
        String hash = bCrypt.encode(raw);
        ApiKey k = new ApiKey(); k.setName(name); k.setKeyHash(hash); k.setActive(true);
        repo.save(k);
        return Map.of("id", String.valueOf(k.getId()), "apiKey", raw); // показываем сырой ключ один раз
    }

    public void revoke(Long id){ var k = repo.findById(id).orElseThrow(); k.setActive(false); repo.save(k); }

    public boolean verify(String presented){
        return repo.findAll().stream().anyMatch(k -> k.isActive() && bCrypt.matches(presented, k.getKeyHash()));
    }
}
