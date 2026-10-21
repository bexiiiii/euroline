package autoparts.kz.modules.mainSearch.controller;

import autoparts.kz.common.security.SimplePrincipal;
import autoparts.kz.modules.customers.service.CustomerService;
import autoparts.kz.modules.mainSearch.service.MainSearchService;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;

class SearchRefreshTest {
    @Test void backgroundRefreshDoesNotCreateSearchHistoryEntries() {
        var service = mock(MainSearchService.class);
        var customers = mock(CustomerService.class);
        var principal = mock(SimplePrincipal.class); when(principal.id()).thenReturn(7L);
        var controller = new SearchController(service, customers);
        controller.search(principal, "12345", null, "MAKER", false);
        controller.search(principal, "12345", null, "MAKER", true);
        new MainSearchController(service, customers).search(principal, "12345", null, "MAKER", true);
        verify(customers, times(1)).saveSearch(7L, "12345");
        verify(service, times(3)).search("12345", null, "MAKER");
    }
}
