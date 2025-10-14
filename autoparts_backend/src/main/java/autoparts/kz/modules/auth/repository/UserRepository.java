package autoparts.kz.modules.auth.repository;


import autoparts.kz.modules.auth.Roles.Role;
import autoparts.kz.modules.auth.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
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
    List<User> findByRole(Role role);

    @Query("select u.id from User u where u.role = :role")
    List<Long> findIdsByRole(@Param("role") Role role);

    @Query("select u.id from User u")
    List<Long> findAllIds();

    // ✅ НОВЫЙ МЕТОД: Получить пользователей за период времени
    List<User> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
}

