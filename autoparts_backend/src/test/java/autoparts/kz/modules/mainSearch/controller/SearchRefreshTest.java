package autoparts.kz.modules.mainSearch.controller;

import autoparts.kz.common.security.SimplePrincipal;
import autoparts.kz.modules.customers.service.CustomerService;
import autoparts.kz.modules.mainSearch.service.GuestSearchLimiter;
import autoparts.kz.modules.mainSearch.service.MainSearchService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SearchRefreshTest {
    @Test void backgroundRefreshDoesNotCreateSearchHistoryEntries() {
        var service = mock(MainSearchService.class);
        var customers = mock(CustomerService.class);
        var limiter = mock(GuestSearchLimiter.class);
        var request = mock(HttpServletRequest.class);
        var principal = mock(SimplePrincipal.class); when(principal.id()).thenReturn(7L);
        var controller = new SearchController(service, customers, limiter);
        controller.search(principal, "12345", null, "MAKER", false, request);
        controller.search(principal, "12345", null, "MAKER", true, request);
        new MainSearchController(service, customers, limiter).search(principal, "12345", null, "MAKER", true, request);
        verify(customers, times(1)).saveSearch(7L, "12345");
        verify(service, times(3)).search("12345", null, "MAKER");
        verifyNoInteractions(limiter); // авторизованных лимит гостя не касается
    }

    @Test void guestOverLimitGets429AndNoSearch() {
        var service = mock(MainSearchService.class);
        var limiter = mock(GuestSearchLimiter.class);
        when(limiter.allowGuest(any(), eq("12345"))).thenReturn(false);
        when(limiter.limitResponse()).thenCallRealMethod();
        var response = new SearchController(service, mock(CustomerService.class), limiter)
                .search(null, "12345", null, null, false, mock(HttpServletRequest.class));
        assertEquals(429, response.getStatusCode().value());
        verifyNoInteractions(service);
    }
}
