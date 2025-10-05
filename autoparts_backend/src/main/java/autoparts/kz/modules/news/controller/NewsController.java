package autoparts.kz.modules.news.controller;

import autoparts.kz.modules.news.dto.NewsRequestDto;
import autoparts.kz.modules.news.dto.NewsResponseDto;
import autoparts.kz.modules.news.mapper.NewsMapper;
import autoparts.kz.modules.news.service.NewsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/news")
@Validated
@RequiredArgsConstructor
public class NewsController {

    private final NewsService newsService;

    @GetMapping("/published")
    public ResponseEntity<List<NewsResponseDto>> getPublishedNews(@RequestParam(name = "limit", required = false) Integer limit) {
        List<NewsResponseDto> newsDtos = newsService.getPublishedNews(limit).stream()
                .map(NewsMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(newsDtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<NewsResponseDto> getNewsById(@PathVariable Long id) {
        return newsService.getNewsById(id)
                .map(NewsMapper::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<NewsResponseDto>> getAllNews() {
        List<NewsResponseDto> newsDtos = newsService.getAllNews().stream()
                .map(NewsMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(newsDtos);
    }

    @PostMapping
    public ResponseEntity<NewsResponseDto> createNews(@Valid @RequestBody NewsRequestDto newsDto) {
        NewsResponseDto responseDto = NewsMapper.toResponse(newsService.createNews(newsDto));
        return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<NewsResponseDto> updateNews(@PathVariable Long id, @Valid @RequestBody NewsRequestDto newsDto) {
        return ResponseEntity.ok(NewsMapper.toResponse(newsService.updateNews(id, newsDto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNews(@PathVariable Long id) {
        newsService.deleteNews(id);
        return ResponseEntity.noContent().build();
    }
}
