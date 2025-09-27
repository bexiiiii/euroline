package autoparts.kz.modules.admin.service;


import autoparts.kz.modules.admin.dto.UserAdminRequest;
import autoparts.kz.modules.admin.dto.UserAdminResponse;
import autoparts.kz.modules.auth.Roles.Role;
import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {
    @Autowired
    private UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserAdminResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> new UserAdminResponse(
                        (long) user.getId(),
                        user.getEmail(),
                        user.getPhone(),
                        user.getCountry(),
                        user.getState(),
                        user.getCity(),
                        user.getOfficeAddress(),
                        user.getType(),
                        user.getSurname(),
                        user.getName(),
                        user.getFathername(),
                        user.getOfficeAddress(),
                        user.getRole().name(),
                        user.isBanned()
                ))
                .collect(Collectors.toList());
    }

    public void createUser(UserAdminRequest request) {
        User user = new User();
        user.setRole(Role.USER);
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setClientName(request.getClientName());
        user.setCountry(request.getCountry());
        user.setState(request.getState());
        user.setCity(request.getCity());
        user.setOfficeAddress(request.getOfficeAddress());
        user.setType(request.getType());
        user.setSurname(request.getSurname());
        user.setName(request.getName());
        user.setFathername(request.getFathername());
        user.setPhone(request.getPhone());

        userRepository.save(user);
    }

    public void setBanStatus(Long id, boolean status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setBanned(status);
        userRepository.save(user);
    }
    public void changeUserRole(Long id, String role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(Role.valueOf(role.toUpperCase()));
        userRepository.save(user);
    }
    public void updateUser(Long id, UserAdminRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setClientName(request.getClientName());
        user.setCountry(request.getCountry());
        user.setState(request.getState());
        user.setCity(request.getCity());
        user.setOfficeAddress(request.getOfficeAddress());
        user.setType(request.getType());
        user.setSurname(request.getSurname());
        user.setName(request.getName());
        user.setFathername(request.getFathername());

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        userRepository.save(user);
    }


}
