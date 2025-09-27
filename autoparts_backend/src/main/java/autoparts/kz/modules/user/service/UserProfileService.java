package autoparts.kz.modules.user.service;

import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.auth.repository.UserRepository;
import autoparts.kz.modules.user.dto.UserProfileResponse;
import autoparts.kz.modules.user.dto.UserProfileUpdateRequest;
import autoparts.kz.modules.user.mapper.UserProfileMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileMapper mapper;

    public UserProfileResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        return mapper.userToResponse(user);
    }

    @Transactional
    public void updateProfile(Long userId, UserProfileUpdateRequest dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        
        // Обновляем поля пользователя
        if (dto.getClientName() != null) user.setClientName(dto.getClientName());
        if (dto.getCountry() != null) user.setCountry(dto.getCountry());
        if (dto.getState() != null) user.setState(dto.getState());
        if (dto.getCity() != null) user.setCity(dto.getCity());
        if (dto.getOfficeAddress() != null) user.setOfficeAddress(dto.getOfficeAddress());
        if (dto.getType() != null) user.setType(dto.getType());
        if (dto.getSurname() != null) user.setSurname(dto.getSurname());
        if (dto.getName() != null) user.setName(dto.getName());
        if (dto.getFathername() != null) user.setFathername(dto.getFathername());
        if (dto.getEmail() != null) user.setEmail(dto.getEmail());
        if (dto.getPhone() != null) user.setPhone(dto.getPhone());
        
        userRepository.save(user);
    }
}