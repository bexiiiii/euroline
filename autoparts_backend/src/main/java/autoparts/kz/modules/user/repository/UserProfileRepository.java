package autoparts.kz.modules.user.repository;


import autoparts.kz.modules.user.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    @Override
    Optional<UserProfile> findById(Long profileId);
    
    Optional<UserProfile> findByUserId(Long userId);
}
