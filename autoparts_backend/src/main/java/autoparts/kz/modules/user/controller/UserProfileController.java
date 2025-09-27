package autoparts.kz.modules.user.controller;



import autoparts.kz.common.security.SimplePrincipal;
import autoparts.kz.modules.user.dto.UserProfileResponse;
import autoparts.kz.modules.user.dto.UserProfileUpdateRequest;
import autoparts.kz.modules.user.service.UserProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class UserProfileController {

    @Autowired
    private UserProfileService userProfileService;

    @GetMapping
    public ResponseEntity<UserProfileResponse> getUserProfile(@AuthenticationPrincipal SimplePrincipal principal) {
        return ResponseEntity.ok(userProfileService.getUserProfile(principal.id()));
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal SimplePrincipal principal,
                                           @RequestBody UserProfileUpdateRequest dto) {
        userProfileService.updateProfile(principal.id(), dto);
        return ResponseEntity.ok().build();
    }
}



