package autoparts.kz.modules.admin.controller;

import autoparts.kz.modules.admin.dto.UserAdminRequest;
import autoparts.kz.modules.admin.dto.UserAdminResponse;
import autoparts.kz.modules.admin.service.AdminUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    @Autowired
    private AdminUserService adminUserService;

    @GetMapping
    public List<UserAdminResponse> getAllUsers() {
        return adminUserService.getAllUsers();
    }
    @PostMapping("/{id}/ban")
    public void banUser(@PathVariable Long id) {
        adminUserService.setBanStatus(id, true);
    }
    @PostMapping("/{id}/unban")
    public void unbanUser(@PathVariable Long id) {
        adminUserService.setBanStatus(id, false);
    }
    @PostMapping("/{id}/role")
    public void changeRole(@PathVariable Long id, @RequestParam String role) {
        adminUserService.changeUserRole(id, role);
    }
    @PostMapping("/create")
    public ResponseEntity<?> createUser(@RequestBody UserAdminRequest request) {
        adminUserService.createUser(request);
        return ResponseEntity.ok().build();
    }
    @PutMapping("/{id}/update")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UserAdminRequest request) {
        adminUserService.updateUser(id, request);
        return ResponseEntity.ok().build();
    }



}
