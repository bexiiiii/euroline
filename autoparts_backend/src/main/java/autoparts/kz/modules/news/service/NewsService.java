package autoparts.kz.modules.news.service;

import autoparts.kz.modules.news.dto.NewsRequestDto;
import autoparts.kz.modules.news.entity.News;
import autoparts.kz.modules.news.mapper.NewsMapper;
import autoparts.kz.modules.news.repository.NewsRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NewsService {

    private final NewsRepository newsRepository;

    public List<News> getAllNews() {
        return newsRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<News> getPublishedNews(Integer limit) {
        if (limit != null && limit > 0) {
            Pageable pageable = PageRequest.of(0, limit);
            return newsRepository.findByPublishedTrueOrderByCreatedAtDesc(pageable);
        }
        return newsRepository.findByPublishedTrueOrderByCreatedAtDesc();
    }

    public Optional<News> getNewsById(Long id) {
        return newsRepository.findById(id);
    }

    @Transactional
    public News createNews(NewsRequestDto request) {
        News news = NewsMapper.toEntity(request);
        return newsRepository.save(news);
    }

    @Transactional
    public News updateNews(Long id, NewsRequestDto request) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("News not found: " + id));
        NewsMapper.updateEntity(request, news);
        return newsRepository.save(news);
    }

    @Transactional
    public void deleteNews(Long id) {
        if (!newsRepository.existsById(id)) {
            throw new EntityNotFoundException("News not found: " + id);
        }
        newsRepository.deleteById(id);
    }
}
