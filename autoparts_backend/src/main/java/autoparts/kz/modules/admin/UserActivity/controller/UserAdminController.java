package autoparts.kz.modules.admin.UserActivity.controller;


import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.auth.repository.UserRepository;
import autoparts.kz.modules.auth.Roles.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Validated
public class UserAdminController {
    private final UserRepository repo;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Page<User> list(@RequestParam(required=false) String q,
                           @RequestParam(defaultValue="0") int page,
                           @RequestParam(defaultValue="20") int size) {
        Pageable p = PageRequest.of(page, size, Sort.by("id").descending());
        if (q==null || q.isBlank()) return repo.findAll(p);
        return repo.findByEmailContainingIgnoreCaseOrNameContainingIgnoreCaseOrSurnameContainingIgnoreCaseOrClientNameContainingIgnoreCase(q, q, q, q, p);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public User create(@RequestBody @Valid CreateUser r) {
        User u = new User();
        u.setEmail(r.email());
        u.setPassword(/* TODO: encode */ r.password());
        u.setRole(Role.valueOf(r.role()));
        u.setBanned(false);
        // Optionally set name/phone if provided
        if (r.name() != null) u.setName(r.name());
        if (r.surname() != null) u.setSurname(r.surname());
        if (r.clientName() != null) u.setClientName(r.clientName());
        if (r.phone() != null) u.setPhone(r.phone());
        return repo.save(u);
    }

    @GetMapping("/{id}") @PreAuthorize("hasRole('ADMIN')")
    public User get(@PathVariable Long id){ return repo.findById(id).orElseThrow(); }

    @PutMapping("/{id}") @PreAuthorize("hasRole('ADMIN')")
    public User update(@PathVariable Long id, @RequestBody @Valid UpdateUser r){
        User u = repo.findById(id).orElseThrow();
        if (r.email()!=null) u.setEmail(r.email());
        if (r.name()!=null) u.setName(r.name());
        if (r.surname()!=null) u.setSurname(r.surname());
        if (r.clientName()!=null) u.setClientName(r.clientName());
        if (r.phone()!=null) u.setPhone(r.phone());
        return repo.save(u);
    }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id){ repo.deleteById(id); }

    @PatchMapping("/{id}/status") @PreAuthorize("hasRole('ADMIN')")
    public User patchStatus(@PathVariable Long id, @RequestParam boolean banned){
        User u = repo.findById(id).orElseThrow();
        u.setBanned(banned);
        return repo.save(u);
    }

    @PatchMapping("/{id}/role") @PreAuthorize("hasRole('ADMIN')")
    public User patchRole(@PathVariable Long id, @RequestParam Role role){
        User u = repo.findById(id).orElseThrow();
        u.setRole(role);
        return repo.save(u);
    }

    // DTO
    public record CreateUser(
            @Email @NotBlank String email,
            @NotBlank @Size(min=8) String password,
            @NotBlank String role,
            String name,
            String surname,
            String clientName,
            String phone
    ) {}
    public record UpdateUser(
            @Email String email,
            String name,
            String surname,
            String clientName,
            String phone
    ) {}
}

