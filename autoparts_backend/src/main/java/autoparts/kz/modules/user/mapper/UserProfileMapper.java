package autoparts.kz.modules.user.mapper;

import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.user.dto.UserProfileResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserProfileMapper {
    
    UserProfileResponse userToResponse(User user);
}
