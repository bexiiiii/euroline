package autoparts.kz.modules.auth.repository;


import autoparts.kz.modules.auth.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    // Search across common user-identifying fields
    Page<User> findByEmailContainingIgnoreCaseOrNameContainingIgnoreCaseOrSurnameContainingIgnoreCaseOrClientNameContainingIgnoreCase(
            String email,
            String name,
            String surname,
            String clientName,
            Pageable pageable
    );
}
