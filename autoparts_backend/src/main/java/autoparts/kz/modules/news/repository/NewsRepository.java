package autoparts.kz.modules.news.repository;

import autoparts.kz.modules.news.entity.News;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NewsRepository extends JpaRepository<News, Long> {
    List<News> findByPublishedTrueOrderByCreatedAtDesc();
    List<News> findByPublishedTrueOrderByCreatedAtDesc(Pageable pageable);
    List<News> findAllByOrderByCreatedAtDesc();
}
