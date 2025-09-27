package autoparts.kz.modules.admin.service;


import autoparts.kz.modules.admin.dto.AdsRequest;
import autoparts.kz.modules.admin.dto.AdsResponse;
import autoparts.kz.modules.admin.entity.Advertisement;
import autoparts.kz.modules.admin.repository.AdvertisementRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;



@Service
public class AdminAdsService {

    private final AdvertisementRepository advertisementRepository;

    public AdminAdsService(AdvertisementRepository advertisementRepository) {
        this.advertisementRepository = advertisementRepository;
    }


    public List<AdsResponse> getAllAds() {
        return advertisementRepository.findAll().stream()
                .map(ad -> new AdsResponse(
                        ad.getId(),
                        ad.getTitle(),
                        ad.getDescription(),
                        ad.getImageUrl(),
                        ad.isActive()
                ))
                .collect(Collectors.toList());
    }
    public void addAd(AdsRequest adsRequest) {
        Advertisement ad = new Advertisement();
        ad.setTitle(adsRequest.getTitle());
        ad.setDescription(adsRequest.getDescription());
        ad.setImageUrl(adsRequest.getImageUrl()); // путь к картинке (может быть frontend URL или "/uploads/...")

        advertisementRepository.save(ad);
    }


    public void deleteAd(Long id) {
        advertisementRepository.deleteById(id);
    }

    public void setActive(Long id, boolean active) {
        Advertisement ad = advertisementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ad not found"));
        ad.setActive(active);
        advertisementRepository.save(ad);
    }

    public void updateAd(Long id, AdsRequest request) {
        Advertisement ad = advertisementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ad not found"));
        ad.setTitle(request.getTitle());
        ad.setDescription(request.getDescription());
        ad.setImageUrl(request.getImageUrl());
        advertisementRepository.save(ad);
    }
}
