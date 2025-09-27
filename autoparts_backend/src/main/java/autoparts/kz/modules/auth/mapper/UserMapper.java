package autoparts.kz.modules.auth.mapper;

import autoparts.kz.modules.auth.dto.UserResponse;
import autoparts.kz.modules.auth.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);
    
    UserResponse toUserResponse(User user);
}
